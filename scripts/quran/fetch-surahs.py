"""
Builds public/quran/{n}.json for the sebha's Quran reader from the Tanzil Uthmani text
(api.alquran.cloud, edition "quran-uthmani"). Nothing in these files is typed by hand.

  python scripts/quran/fetch-surahs.py

Each file: {number, name, basmala (bool), basmalaText, ayahs[], source}. The basmala that the
source puts at the start of verse 1 (every surah but Al-Fatiha, where it is verse 1) is moved to
`basmalaText` so the page can show it as a heading, exactly as in a printed Mushaf.
"""
import json
import os
import urllib.request

SURAHS = {1: "الفاتحة", 36: "يس", 67: "الملك", 112: "الإخلاص"}
API = "https://api.alquran.cloud/v1/surah/{}/quran-uthmani"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "quran")


def fetch(n):
    with urllib.request.urlopen(API.format(n), timeout=30) as r:
        data = json.load(r)["data"]
    ayahs = [a["text"].replace("﻿", "").strip() for a in data["ayahs"]]
    assert len(ayahs) == data["numberOfAyahs"], n
    return ayahs


def main():
    os.makedirs(OUT, exist_ok=True)
    basmala = fetch(1)[0]  # Al-Fatiha 1:1, the source's own spelling
    for n, name in SURAHS.items():
        ayahs = fetch(n)
        has = n != 1
        if has:
            assert ayahs[0].startswith(basmala), f"surah {n}: verse 1 does not start with the basmala"
            ayahs[0] = ayahs[0][len(basmala):].strip()
        out = {"number": n, "name": name, "basmala": has, "basmalaText": basmala if has else "", "ayahs": ayahs,
               "source": "Tanzil Uthmani text via api.alquran.cloud (quran-uthmani)"}
        with open(os.path.join(OUT, f"{n}.json"), "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(n, len(ayahs))


if __name__ == "__main__":
    main()
