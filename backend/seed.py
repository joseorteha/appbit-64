"""Seed de la base de datos para desarrollo y demo.

Carga los CSVs pequeños de Vísent (los que ya están en el repo) en la base
configurada (SQLite por defecto, o PostgreSQL si DATABASE_URL apunta a Postgres).

Uso:
    cd backend
    python seed.py

Requiere que las tablas existan; las crea automáticamente al importar la app.
Es idempotente: borra el contenido de cada tabla antes de recargar.
"""
import os
import sys
import math

import pandas as pd
from sqlalchemy import text

from app.database import engine, create_tables

# Ubicación de los CSVs (relativa a backend/)
DATASET = os.path.join(os.path.dirname(__file__), "..", "appbit-main", "dataset-visent")
REF = os.path.join(DATASET, "referencias")
TEN = os.path.join(DATASET, "tensores")


def _truncate(tabla: str):
    with engine.begin() as conn:
        conn.execute(text(f"DELETE FROM {tabla}"))


def seed_antenas():
    path = os.path.join(REF, "antenas_flp.csv")
    df = pd.read_csv(path, dtype={"ecgi": str})
    df.columns = df.columns.str.strip()
    cols = ["ecgi", "cluster", "municipio", "lat", "lon"]
    df = df[[c for c in cols if c in df.columns]]
    _truncate("antenas")
    df.to_sql("antenas", engine, if_exists="append", index=False)
    print(f"  antenas: {len(df)} filas")


def seed_concentracion():
    path = os.path.join(TEN, "tensor_concentracao.csv")
    df = pd.read_csv(path, dtype={"ecgi": str})
    df.columns = df.columns.str.strip()
    if "day_date" in df.columns:
        df["day_date"] = pd.to_datetime(df["day_date"], errors="coerce").dt.date
    # Solo columnas que el modelo conoce
    model_cols = [
        "ecgi", "cluster", "municipio", "day_date", "periodo", "n_usuarios",
        "n_sessoes", "download_bytes", "upload_bytes", "dur_media_s",
        "drop_pct_medio", "congestionamento_medio", "chamadas_total",
        "mensagens_total", "lat", "lon",
    ]
    df = df[[c for c in model_cols if c in df.columns]]
    _truncate("concentracion")
    df.to_sql("concentracion", engine, if_exists="append", index=False, chunksize=2000)
    print(f"  concentracion: {len(df)} filas")


def seed_flujos():
    path = os.path.join(TEN, "tensor_fluxo_vias.csv")
    df = pd.read_csv(path, dtype={"ecgi_origem": str, "ecgi_destino": str})
    df.columns = df.columns.str.strip()
    # Nombres ya coinciden con el modelo (portugués, igual que el CSV)
    model_cols = [
        "ecgi_origem", "lat_origem", "lon_origem", "cluster_origem", "municipio_origem",
        "ecgi_destino", "lat_destino", "lon_destino", "cluster_destino", "municipio_destino",
        "n_usuarios", "n_transicoes", "dist_km", "periodo_predominante", "pct_do_cluster_origem",
    ]
    df = df[[c for c in model_cols if c in df.columns]]
    _truncate("flujos")
    df.to_sql("flujos", engine, if_exists="append", index=False, chunksize=2000)
    print(f"  flujos: {len(df)} filas")


def seed_demograficos():
    path = os.path.join(REF, "assinantes.csv")
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    # Mapear nombres del CSV al modelo
    if "home_cluster" in df.columns:
        df = df.rename(columns={"home_cluster": "cluster"})
    flagship_col = "flag_flagship" if "flag_flagship" in df.columns else (
        "flagship" if "flagship" in df.columns else None
    )

    group_cols = [c for c in ["cluster", "income_cluster", "age_group"] if c in df.columns]
    if not group_cols:
        print("  demograficos: columnas esperadas no encontradas, omitido")
        return

    agg = df.groupby(group_cols).size().reset_index(name="n_usuarios")
    if flagship_col:
        fl = df.groupby(group_cols)[flagship_col].mean().reset_index()
        fl = fl.rename(columns={flagship_col: "pct_flagship"})
        agg = agg.merge(fl, on=group_cols, how="left")

    _truncate("demograficos")
    agg.to_sql("demograficos", engine, if_exists="append", index=False)
    print(f"  demograficos: {len(agg)} grupos")


def seed_indicadores():
    """Genera indicadores por cluster a partir de datos reales de concentración
    cuando existen, y sintéticos etiquetados para el resto."""
    import random
    random.seed(42)

    with engine.begin() as conn:
        clusters = [r[0] for r in conn.execute(text("SELECT DISTINCT cluster FROM antenas")).fetchall()]
        # Concentración media por cluster (dato real para empleabilidad)
        conc_rows = conn.execute(text(
            "SELECT cluster, AVG(n_usuarios) FROM concentracion "
            "WHERE periodo='MANHA' GROUP BY cluster"
        )).fetchall()
    conc_manha = {r[0]: (r[1] or 0) for r in conc_rows}

    if not clusters:
        print("  indicadores: no hay clusters (carga antenas primero), omitido")
        return

    rows = []
    for c in clusters:
        rows.append({
            "cluster": c, "vertical": "salud_mental",
            "metrica": "indice_riesgo_exclusion_digital",
            "valor": round(random.uniform(0.2, 0.95), 3),
            "periodo": None, "fuente": "sintético", "es_sintetico": True,
        })
        rows.append({
            "cluster": c, "vertical": "empleabilidad",
            "metrica": "concentracion_horario_laboral",
            "valor": round(conc_manha.get(c, random.uniform(100, 3000)), 1),
            "periodo": "MANHA",
            "fuente": "Vísent CDRView" if c in conc_manha else "sintético",
            "es_sintetico": c not in conc_manha,
        })
        rows.append({
            "cluster": c, "vertical": "formaciones",
            "metrica": "poblacion_joven_sin_conectividad",
            "valor": round(random.uniform(50, 3000), 0),
            "periodo": None, "fuente": "sintético", "es_sintetico": True,
        })

    df = pd.DataFrame(rows)
    _truncate("indicadores")
    df.to_sql("indicadores", engine, if_exists="append", index=False)
    print(f"  indicadores: {len(df)} filas")


def seed_cobertura():
    """Cobertura sintética por cluster — fallback hasta que corra el ETL real."""
    import random
    random.seed(42)

    with engine.begin() as conn:
        clusters = [r[0] for r in conn.execute(
            text("SELECT DISTINCT cluster FROM antenas")
        ).fetchall()]
        existing = conn.execute(text("SELECT COUNT(*) FROM cobertura")).scalar()

    if existing:
        print(f"  cobertura: ya tiene {existing} filas, omitido")
        return
    if not clusters:
        print("  cobertura: no hay clusters (carga antenas primero), omitido")
        return

    rows = []
    for c in clusters:
        pct_3g = round(random.uniform(0.15, 0.70), 3)
        pct_4g = round(random.uniform(0.20, 0.65), 3)
        pct_5g = round(max(0, 1 - pct_3g - pct_4g), 3)
        rows.append({
            "cluster": c,
            "total_sessoes": random.randint(8_000, 120_000),
            "pct_3g": pct_3g, "pct_4g": pct_4g, "pct_5g": pct_5g,
            "drop_pct_medio": round(random.uniform(0.05, 0.25), 3),
            "congestionamento_medio": round(random.uniform(0.2, 0.8), 3),
            "download_gb": round(random.uniform(50, 8000), 1),
        })

    df = pd.DataFrame(rows)
    _truncate("cobertura")
    df.to_sql("cobertura", engine, if_exists="append", index=False)
    print(f"  cobertura: {len(df)} filas sintéticas")


def main():
    print("=== Seed App BiT 64 ===")
    print(f"DB: {engine.url}")
    if not os.path.isdir(DATASET):
        print(f"\n[!] No se encontro el dataset en: {DATASET}")
        print("  Ajusta la ruta o descomprime el dataset ahí.")
        sys.exit(1)

    create_tables()
    print("Tablas creadas/verificadas.\nCargando datos:")
    seed_antenas()
    seed_concentracion()
    seed_flujos()
    seed_demograficos()
    seed_indicadores()
    seed_cobertura()
    print("\n[OK] Seed completado.")


if __name__ == "__main__":
    main()
