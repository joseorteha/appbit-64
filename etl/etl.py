"""
ETL App BiT 64 — procesamiento incremental de los archivos PESADOS de Vísent.

PROBLEMA: tensor_mobilidade.csv pesa 2.7 GB (16.8M filas). Cargarlo de una vez
con pd.read_csv() consumiría ~11 GB de RAM y el proceso se caería.

SOLUCIÓN (este script): patrón map-reduce por streaming.
  1. Leer en CHUNKS de 500k filas (nunca todo junto).
  2. Leer SOLO las columnas necesarias (usecols) con tipos compactos (category).
  3. Agregar cada chunk parcialmente (groupby cluster + rat_type).
  4. Acumular los parciales en una tabla minúscula (~80 filas).
  5. Al final, reducir y guardar el resultado agregado en la BD.

La memoria usada es CONSTANTE (~150 MB) sin importar el tamaño del archivo.

Uso:
    cd etl
    python etl.py --mobilidade          # genera la tabla 'cobertura' + actualiza indicadores
    python etl.py --mobilidade --sample 2000000   # prueba rápida con 2M filas
    python etl.py --sequencias          # (opcional, post-MVP) trayectos individuales
"""
import os
import sys
import time
import argparse

import pandas as pd
from sqlalchemy import text

# Permite importar los modelos del backend (para crear la tabla cobertura)
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, BACKEND_DIR)

# Apuntar a la MISMA base que el backend, con ruta ABSOLUTA (evita que SQLite
# cree archivos distintos según el directorio de ejecución). Si ya viene de un
# .env (p.ej. PostgreSQL en prod), se respeta.
if not os.getenv("DATABASE_URL"):
    db_path = os.path.join(BACKEND_DIR, "appbit64.db").replace("\\", "/")
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

from app.database import engine, create_tables  # noqa: E402  (usa el mismo engine del backend)

DATASET = os.path.join(os.path.dirname(__file__), "..", "appbit-main", "dataset-visent")
TEN = os.path.join(DATASET, "tensores")
CHUNK = 500_000

# Mapeo de tecnología de radio → generación de red
RAT_GEN = {"WCDMA": "3g", "LTE": "4g", "NR": "5g"}


def _fmt(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def process_mobilidade(sample: int | None = None):
    path = os.path.join(TEN, "tensor_mobilidade.csv")
    if not os.path.exists(path):
        print(f"[!] No encontrado: {path}\n    Descargalo de Google Drive (ver LARGE_FILES.md)")
        return

    # Solo las columnas que necesitamos (de 29 a 7) → menos memoria y más rapido
    usecols = [
        "cluster", "rat_type", "n_sessoes",
        "download_bytes", "drop_pct", "congestionamento",
    ]
    dtypes = {
        "cluster": "category",
        "rat_type": "category",
        "n_sessoes": "int32",
        "download_bytes": "int64",
        "drop_pct": "float32",
        "congestionamento": "float32",
    }

    print(f"Procesando tensor_mobilidade.csv (chunks de {_fmt(CHUNK)} filas)...")
    if sample:
        print(f"  [modo prueba: solo {_fmt(sample)} filas]")

    parciales = []
    total_filas = 0
    t0 = time.time()

    reader = pd.read_csv(
        path, usecols=usecols, dtype=dtypes, chunksize=CHUNK,
        nrows=sample,
    )
    for i, chunk in enumerate(reader):
        # Pesos para promedios ponderados (por nº de sesiones)
        chunk["drop_w"] = chunk["drop_pct"] * chunk["n_sessoes"]
        chunk["cong_w"] = chunk["congestionamento"] * chunk["n_sessoes"]

        g = (
            chunk.groupby(["cluster", "rat_type"], observed=True)
            .agg(
                eventos=("n_sessoes", "size"),
                sessoes=("n_sessoes", "sum"),
                download=("download_bytes", "sum"),
                drop_w=("drop_w", "sum"),
                cong_w=("cong_w", "sum"),
            )
            .reset_index()
        )
        parciales.append(g)

        total_filas += len(chunk)
        vel = total_filas / max(time.time() - t0, 0.001)
        print(f"  chunk {i+1:>2} | {_fmt(total_filas):>12} filas | {vel/1000:,.0f}k filas/s", end="\r")

    print()
    if not parciales:
        print("[!] No se proceso ninguna fila.")
        return

    # REDUCE: combinar todos los parciales y re-agregar
    total = (
        pd.concat(parciales)
        .groupby(["cluster", "rat_type"], observed=True)
        .sum()
        .reset_index()
    )

    # Pivot: una fila por cluster, columnas por generación de red
    total["gen"] = total["rat_type"].astype(str).map(RAT_GEN).fillna("otro")
    sess = total.pivot_table(index="cluster", columns="gen", values="sessoes",
                             aggfunc="sum", fill_value=0, observed=True)

    # Métricas agregadas por cluster
    agg = (
        total.groupby("cluster", observed=True)
        .agg(total_sessoes=("sessoes", "sum"),
             total_eventos=("eventos", "sum"),
             drop_w=("drop_w", "sum"),
             cong_w=("cong_w", "sum"),
             download=("download", "sum"))
        .reset_index()
    )

    rows = []
    for _, r in agg.iterrows():
        cl = r["cluster"]
        tot = r["total_sessoes"] or 1
        rows.append({
            "cluster": cl,
            "total_sessoes": int(r["total_sessoes"]),
            "total_eventos": int(r["total_eventos"]),
            "pct_3g": round(float(sess.loc[cl].get("3g", 0)) / tot, 4),
            "pct_4g": round(float(sess.loc[cl].get("4g", 0)) / tot, 4),
            "pct_5g": round(float(sess.loc[cl].get("5g", 0)) / tot, 4),
            "drop_pct_medio": round(float(r["drop_w"]) / tot, 4),
            "congestionamento_medio": round(float(r["cong_w"]) / tot, 4),
            "download_gb": round(float(r["download"]) / 1e9, 2),
        })

    cob = pd.DataFrame(rows)

    # Guardar tabla cobertura (recrea las tablas si no existen)
    create_tables()
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM cobertura"))
    cob.to_sql("cobertura", engine, if_exists="append", index=False)

    _actualizar_indicadores(cob)

    elapsed = time.time() - t0
    print(f"\n[OK] {_fmt(total_filas)} filas en {elapsed:.0f}s "
          f"({total_filas/max(elapsed,1)/1000:,.0f}k filas/s)")
    print(f"     tabla 'cobertura': {len(cob)} clusters")
    print("\nTop 5 exclusion digital (mayor % en red 3G/WCDMA):")
    top = cob.sort_values("pct_3g", ascending=False).head(5)
    for _, r in top.iterrows():
        print(f"  {r['cluster']:<22} 3G={r['pct_3g']:.0%}  4G={r['pct_4g']:.0%}  "
              f"5G={r['pct_5g']:.0%}  drop={r['drop_pct_medio']:.1%}")


def _actualizar_indicadores(cob: pd.DataFrame):
    """Reemplaza el indicador sintético de salud_mental por el dato REAL de cobertura."""
    with engine.begin() as conn:
        # Borra el indicador real previo (si se re-ejecuta el ETL)
        conn.execute(text(
            "DELETE FROM indicadores WHERE vertical='salud_mental' "
            "AND metrica='indice_exclusion_digital'"
        ))
        for _, r in cob.iterrows():
            conn.execute(
                text(
                    "INSERT INTO indicadores "
                    "(cluster, vertical, metrica, valor, periodo, fuente, es_sintetico) "
                    "VALUES (:c, 'salud_mental', 'indice_exclusion_digital', :v, NULL, "
                    "'Vísent CDRView (mobilidade)', 0)"
                ),
                {"c": r["cluster"], "v": float(r["pct_3g"])},
            )
    print("     indicadores: 'indice_exclusion_digital' actualizado (dato REAL)")


def process_sequencias(sample: int | None = None):
    """Opcional (post-MVP): trayectos individuales. Mismo patrón por chunks."""
    path = os.path.join(TEN, "tensor_sequencias.csv")
    if not os.path.exists(path):
        print(f"[!] No encontrado: {path}")
        return
    print("Procesando tensor_sequencias.csv (chunks)...")
    total = 0
    t0 = time.time()
    for i, chunk in enumerate(pd.read_csv(
        path, usecols=["cluster", "permanencia_seg", "distancia_km_anterior"],
        dtype={"permanencia_seg": "int32", "distancia_km_anterior": "float32"},
        chunksize=CHUNK, nrows=sample,
    )):
        total += len(chunk)
        print(f"  chunk {i+1}: {_fmt(total)} filas", end="\r")
    print(f"\n[OK] {_fmt(total)} sesiones leidas en {time.time()-t0:.0f}s "
          "(agregacion de trayectos: TODO post-MVP)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ETL incremental de archivos pesados de Vísent")
    parser.add_argument("--mobilidade", action="store_true", help="Procesar tensor_mobilidade.csv → cobertura")
    parser.add_argument("--sequencias", action="store_true", help="Procesar tensor_sequencias.csv (post-MVP)")
    parser.add_argument("--sample", type=int, default=None, help="Procesar solo N filas (prueba rápida)")
    args = parser.parse_args()

    if not (args.mobilidade or args.sequencias):
        print(__doc__)
        print("Para los CSVs pequeños usa: cd backend && python seed.py")
        sys.exit(0)

    print(f"DB: {engine.url}\n")
    if args.mobilidade:
        process_mobilidade(sample=args.sample)
    if args.sequencias:
        process_sequencias(sample=args.sample)
