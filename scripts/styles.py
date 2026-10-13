"""Single source of truth for the 15 Canvas motion-design style profiles."""
import copy
import json
from pathlib import Path

CATALOG = Path(__file__).resolve().parents[1] / "engine/styles.json"


def load_styles():
    """Return fresh profile data; callers may adapt it for their own film."""
    return json.loads(CATALOG.read_text(encoding="utf-8"))


def get_style(style_id):
    if not isinstance(style_id, str):
        raise ValueError("风格 ID 必须是字符串")
    for profile in load_styles():
        if profile["id"] == style_id.lower():
            return copy.deepcopy(profile)
    raise ValueError(f"未知风格：{style_id}；用 --list-styles 查看可选项")
