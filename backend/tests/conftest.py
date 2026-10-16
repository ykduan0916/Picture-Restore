"""pytest 配置。"""
import sys
from pathlib import Path

# 将 app 目录添加到 Python 路径
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))
