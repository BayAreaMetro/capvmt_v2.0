"""Configuration variables for CAPVMT ETL script."""
from mtcpy.credentials import BOX_ROOT_DIR

# Adjust the path to the root data directory (VMT Dataportal) as needed
ROOT_DATA_DIR = BOX_ROOT_DIR / "DSA Projects" / "Air District" / "VMT Dataportal"
INPUTS_FOLDER = ROOT_DATA_DIR / "scripts_data_2026_update"
