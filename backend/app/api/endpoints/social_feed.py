"""
Real-time social/news feed from:
1. YouTube Data API v3  – coastal hazard videos
2. RSS feeds            – NDTV Disaster, NDMA, ReliefWeb India
3. GDACS               – Global Disaster Alert & Coordination System
"""
from fastapi import APIRouter, Query
from typing import List, Dict, Any
import httpx
import os
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import asyncio

router = APIRouter()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

RSS_FEEDS = [
    {
        "url": "https://feeds.feedburner.com/ndtvnews-india-news",
        "source": "NDTV",
        "label": "NDTV News",
    },
    {
        "url": "https://reliefweb.int/country/ind/rss.xml",
        "source": "ReliefWeb",
        "label": "ReliefWeb India",
    },
    {
        "url": "https://www.gdacs.org/xml/rss.xml",
        "source": "GDACS",
        "label": "GDACS Alerts",
    },
]

COASTAL_KEYWORDS = [
    "coastal flood", "tsunami", "cyclone", "storm surge", "high waves",
    "rip current", "sea level", "coastal erosion", "marine", "ocean hazard",
    "beach warning", "flood alert", "disaster", "evacuation coast",
    "India flood", "India cyclone", "Bay of Bengal", "Arabian Sea",
]

def _is_relevant(text: str) -> bool:
    """Check if text contains any coastal/disaster keyword."""
    t = (text or "").lower()
    return any(kw.lower() in t for kw in COASTAL_KEYWORDS)

def _parse_rss_date(date_str: str) -> str:
    """Try to parse RSS date string to ISO format."""
    if not date_str:
        return datetime.now(timezone.utc).isoformat()
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S%z",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).isoformat()
        except ValueError:
            continue
    return datetime.now(timezone.utc).isoformat()


async def _fetch_youtube(limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch recent coastal hazard videos from YouTube."""
    if not YOUTUBE_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(YOUTUBE_SEARCH_URL, params={
                "part": "snippet",
                "q": "India coastal flood tsunami cyclone warning 2025",
                "type": "video",
                "order": "date",
                "maxResults": limit,
                "relevanceLanguage": "en",
                "key": YOUTUBE_API_KEY,
            })
            if resp.status_code != 200:
                return []
            data = resp.json()
            items = []
            for item in data.get("items", []):
                snippet = item.get("snippet", {})
                title = snippet.get("title", "")
                description = snippet.get("description", "")
                if not _is_relevant(title + " " + description):
                    continue
                video_id = item.get("id", {}).get("videoId", "")
                items.append({
                    "id": f"yt_{video_id}",
                    "source": "YouTube",
                    "source_icon": "📺",
                    "title": title,
                    "content": description[:300] if description else title,
                    "link": f"https://www.youtube.com/watch?v={video_id}",
                    "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "author": snippet.get("channelTitle", "YouTube"),
                    "location": "India",
                    "created_at": _parse_rss_date(snippet.get("publishedAt", "")),
                    "category": "External Alert",
                    "urgency": "medium",
                })
            return items
    except Exception as e:
        print(f"YouTube fetch error: {e}")
        return []


async def _fetch_rss(feed: Dict, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch and parse a single RSS feed, filtering for coastal keywords."""
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(feed["url"], headers={"User-Agent": "Pravaah/1.0"})
            if resp.status_code != 200:
                return []
            root = ET.fromstring(resp.text)
            # Handle both RSS and Atom
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            items_xml = root.findall(".//item") or root.findall(".//atom:entry", ns)
            results = []
            for item in items_xml[:50]:  # scan up to 50, filter relevant
                # RSS
                title_el = item.find("title")
                desc_el = item.find("description") or item.find("summary")
                link_el = item.find("link")
                date_el = item.find("pubDate") or item.find("published") or item.find("updated")

                title = (title_el.text or "").strip() if title_el is not None else ""
                desc = (desc_el.text or "").strip() if desc_el is not None else ""
                # Strip HTML tags from description
                import re
                desc = re.sub(r"<[^>]+>", "", desc)[:300]
                link = (link_el.text or "").strip() if link_el is not None else feed["url"]
                date_str = (date_el.text or "").strip() if date_el is not None else ""

                if not title:
                    continue
                if not _is_relevant(title + " " + desc):
                    continue

                results.append({
                    "id": f"rss_{feed['source']}_{hash(title)}",
                    "source": feed["label"],
                    "source_icon": "📰" if feed["source"] != "GDACS" else "🚨",
                    "title": title,
                    "content": desc or title,
                    "link": link,
                    "thumbnail": "",
                    "author": feed["label"],
                    "location": "India",
                    "created_at": _parse_rss_date(date_str),
                    "category": "External Alert",
                    "urgency": "high" if feed["source"] == "GDACS" else "medium",
                })
                if len(results) >= limit:
                    break
            return results
    except Exception as e:
        print(f"RSS fetch error ({feed['source']}): {e}")
        return []


@router.get("/external-feed", response_model=List[Dict[str, Any]])
async def get_external_feed(limit: int = Query(30, ge=1, le=100)):
    """
    Fetch real-time coastal hazard data from:
    - YouTube Data API (if YOUTUBE_API_KEY is set)
    - NDTV RSS
    - ReliefWeb India RSS
    - GDACS disaster alerts RSS
    All filtered for coastal/disaster relevance.
    """
    tasks = [_fetch_rss(feed, limit=10) for feed in RSS_FEEDS]
    if YOUTUBE_API_KEY:
        tasks.append(_fetch_youtube(limit=10))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    combined = []
    for r in results:
        if isinstance(r, list):
            combined.extend(r)

    # Sort by date descending
    def _sort_key(item):
        try:
            return datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
        except Exception:
            return datetime.min.replace(tzinfo=timezone.utc)

    combined.sort(key=_sort_key, reverse=True)
    return combined[:limit]
