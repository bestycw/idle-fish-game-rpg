#!/usr/bin/env python3
"""Parse the zhongtu spec tables and emit zhongtuRoster.ts."""
from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SPEC = ROOT / "docs/superpowers/specs/2026-08-26-zhongtu-roster-circles-design.md"
OUT = ROOT / "packages/game-core/src/character/roster/zhongtuRoster.ts"

CIRCLE_HEAD = re.compile(r"^### 2\.\d+ .+ `([a-z]+)`")
ROW = re.compile(r"^\| ([a-z0-9_]+) \| ([^|]+) \| (凡|良|珍|绝) \| ([a-z_]+) \|$")
RARITY = {"凡": "common", "良": "rare", "珍": "epic", "绝": "legendary"}

ROLE_KITS: dict[str, list[str]] = {
    "tank": ["guard", "taunt", "earth", "first_guard", "team_wall", "hp_guard"],
    "st_burst": ["bleed_pierce", "execute", "hunt_back", "high_hp", "first_strike", "col_kill", "mark_hunt"],
    "aoe_dps": ["row_smash", "cross_hit", "col_wave", "surround_aoe", "first_wave"],
    "st_ctrl": ["stun", "silence", "heal_block", "sleep", "slow_pin"],
    "aoe_ctrl": ["havoc", "mass_slow", "mass_silence", "mass_sleep", "slow_pin"],
    "group_amp": ["amp_atk", "amp_qi", "amp_spd", "qi_drought", "amp_def"],
    "st_heal": ["heal_cleanse", "heal_low", "regen"],
    "aoe_heal": ["team_heal", "team_aegis", "heal_low", "heal_cleanse"],
    "flex": ["flex_purge", "flex_first", "flex_bleed", "flex_stun", "flex_qi", "first_strike"],
}

EXTRA_POOL = [
    "first_strike",
    "slow_pin",
    "flex_qi",
    "high_hp",
    "surround_aoe",
    "heal_low",
    "amp_def",
    "flex_bleed",
]

SPECIAL_KITS = {
    "sunbin": ["shred_trap", "qi_drought", "amp_qi"],
    "gongshuban": ["shred_guard", "taunt", "earth"],
    "zhuge": ["qi_drought", "amp_qi", "slow_pin"],
}

SKILL_NAMES = {
    "hero": "破妄斩",
    "zhangfei": "当阳吼",
    "zhaoyun": "龙胆枪",
    "wukong": "定海神针",
    "huatuo": "青囊济世",
    "houyi": "九日尽",
    "zhuge": "借东风",
    "baigujing": "化骨绵掌",
    "guanyu": "温酒青龙",
    "lvbu": "方天画戟",
    "dianwei": "恶来守营",
    "nezha": "风火轮",
    "daji": "狐媚惑心",
    "yangjian": "三尖两刃",
    "change": "月华清辉",
    "xishi": "沉鱼一笑",
    "sunbin": "减灶",
    "zhouyu": "赤壁业火",
    "xiangyu": "破釜沉舟",
    "nuwa": "补天炼石",
    "yuefei": "精忠枪",
    "jiangziya": "封神榜",
    "liubei": "桃园结义",
    "pangtong": "落凤坡",
    "caocao": "挟天子",
    "simayi": "鹰视狼顾",
    "tangseng": "紧箍咒",
    "niumowang": "混世魔王",
    "tieshan": "芭蕉扇",
    "jingke": "图穷匕见",
    "nieyinniang": "隐娘刺",
    "libai": "将进酒",
    "linchong": "豹子头",
    "wusong": "景阳冈",
    "luzhishen": "倒拔垂杨",
    "zhongkui": "捉鬼啖邪",
    "huapi": "画皮换面",
    "chenxiang": "斧劈华山",
    "lishimin": "天策府",
    "leizhenzi": "风雷翅",
    "xingtian": "干戚舞",
    "chiyou": "兵主开战",
}

MOTIFS = {
    "hero": "无名行者补位",
    "zhangfei": "当阳桥头一声喝",
    "zhaoyun": "长坂坡七进七出",
    "wukong": "金箍棒扫开天地",
    "huatuo": "剖骨疗毒",
    "houyi": "射落九日",
    "zhuge": "借东风布八阵",
    "liubei": "仁德聚义",
    "sunbin": "减灶诱敌",
    "gongshuban": "云梯攻城",
}


def parse_spec() -> list[dict]:
    circle = None
    rows: list[dict] = []
    for line in SPEC.read_text().splitlines():
        m = CIRCLE_HEAD.match(line)
        if m:
            circle = m.group(1)
            continue
        if line.startswith("### 2.17"):
            circle = None
            continue
        r = ROW.match(line)
        if not r:
            continue
        cid, name, rarity_zh, role = r.group(1), r.group(2).strip(), r.group(3), r.group(4)
        rows.append(
            {
                "id": cid,
                "name": name,
                "circleId": circle,
                "rarity": RARITY[rarity_zh],
                "role": role,
            }
        )
    return rows


def assign_kits(rows: list[dict]) -> None:
    used_primary: dict[str, set[str]] = defaultdict(set)
    counters: dict[str, int] = defaultdict(int)
    for e in rows:
        if e["id"] in SPECIAL_KITS:
            e["kits"] = SPECIAL_KITS[e["id"]]
            continue
        pool = ROLE_KITS[e["role"]]
        i = counters[e["role"]]
        counters[e["role"]] += 1
        primary = pool[i % len(pool)]
        if e["rarity"] == "common":
            # unique primary among 凡 of same role
            tries = 0
            while primary in used_primary[e["role"]] and tries < len(pool):
                i += 1
                primary = pool[i % len(pool)]
                tries += 1
            used_primary[e["role"]].add(primary)
        extra = EXTRA_POOL[(i * 3 + 1) % len(EXTRA_POOL)]
        third = EXTRA_POOL[(i * 3 + 2) % len(EXTRA_POOL)]
        if extra == primary:
            extra = EXTRA_POOL[(i * 3 + 4) % len(EXTRA_POOL)]
        if third == primary or third == extra:
            third = pool[(i + 2) % len(pool)]
        e["kits"] = [primary, extra, third]


def skill_name(e: dict) -> str:
    if e["id"] in SKILL_NAMES:
        return SKILL_NAMES[e["id"]]
    return e["name"][0] + "诀"


def motif(e: dict) -> str:
    if e["id"] in MOTIFS:
        return MOTIFS[e["id"]]
    return e["name"] + "本事"


def emit(rows: list[dict]) -> str:
    lines = [
        "/** 中土故事圈全表（含主角）。由 spec 表生成，勿手改人数。 */",
        "import type { Rarity, Role } from '../../shared/types.js';",
        "import {",
        "  CIRCLE_LABELS,",
        "  unlockFor,",
        "  type CircleId,",
        "  type UnlockBatch,",
        "} from './circles.js';",
        "import type { KitId } from './kitCompose.js';",
        "",
        "export interface ZhongtuEntry {",
        "  id: string;",
        "  name: string;",
        "  circleId: CircleId | null;",
        "  rarity: Rarity;",
        "  role: Role;",
        "  motif: string;",
        "  skillName: string;",
        "  lore: string;",
        "  unlock: UnlockBatch | null;",
        "  kits: KitId[];",
        "}",
        "",
        "const ROWS: Array<[",
        "  string, string, CircleId | null, Rarity, Role, string, string, KitId, KitId, KitId",
        "]> = [",
    ]
    seen_names: set[str] = set()
    for e in rows:
        sn = skill_name(e)
        if sn in seen_names:
            sn = e["name"] + "·" + sn
        seen_names.add(sn)
        kits = e["kits"]
        while len(kits) < 3:
            kits.append(kits[-1])
        circle = "null" if e["circleId"] is None else f"'{e['circleId']}'"
        motif_s = motif(e).replace("'", "\\'")
        sn_s = sn.replace("'", "\\'")
        lines.append(
            f"  ['{e['id']}', '{e['name']}', {circle}, '{e['rarity']}', '{e['role']}', '{motif_s}', '{sn_s}', '{kits[0]}', '{kits[1]}', '{kits[2]}'],"
        )
    lines += [
        "];",
        "",
        "export const ZHONGTU_ROSTER: ZhongtuEntry[] = ROWS.map((r) => {",
        "  const [id, name, circleId, rarity, role, motif, skillName, k1, k2, k3] = r;",
        "  return {",
        "    id,",
        "    name,",
        "    circleId,",
        "    rarity,",
        "    role,",
        "    motif,",
        "    skillName,",
        "    lore: circleId ? CIRCLE_LABELS[circleId] : '旅途',",
        "    unlock: unlockFor(id, circleId, rarity),",
        "    kits: [k1, k2, k3],",
        "  };",
        "});",
        "",
        "const byId = new Map(ZHONGTU_ROSTER.map((e) => [e.id, e]));",
        "",
        "export function getZhongtuEntry(id: string): ZhongtuEntry | undefined {",
        "  return byId.get(id);",
        "}",
        "",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    rows = parse_spec()
    assert len(rows) == 200, len(rows)
    ids = [e["id"] for e in rows]
    assert len(set(ids)) == 200
    assign_kits(rows)
    OUT.write_text(emit(rows))
    print(f"wrote {len(rows)} rows -> {OUT}")


if __name__ == "__main__":
    main()
