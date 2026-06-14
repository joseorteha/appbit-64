# ETL

Procesamiento incremental de los tensores pesados de VIsent.

## Archivos

- `etl.py`: script principal de carga y agregacion.
- `requirements.txt`: dependencias de Python.
- `appbit64.db`: base local generada por el proceso. No se debe subir al repo.

## Uso

Desde la raiz del proyecto:

```bash
cd etl
python etl.py --mobilidade
python etl.py --mobilidade --sample 2000000
python etl.py --sequencias
```

## Notas

- El script lee los CSV por chunks para no cargar todo en memoria.
- El archivo `appbit64.db` queda ignorado por el `.gitignore` raiz.
- Los CSV pesados del dataset no deben subirse al repositorio.
