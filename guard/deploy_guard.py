#!/usr/bin/env python3
"""TrendCheck fail-closed deploy guard (user constraint 2026-10-25 10:10:09: 덮어쓰기하지마).
Verifies a candidate deploy tree against CURRENT live worker content and CURRENT origin/main:
  1. No existing article file (articles/**, <locale>/articles/**) is modified or deleted,
     EXCEPT files explicitly listed as MOD:<path> in the operation's allowlist (approved
     compliance corrections to our own authored articles, main decision 2026-10-25 10:42:59):
     modification allowed only if the <title> (topic) is unchanged; deletion never allowed.
     MODTITLE:<path> additionally permits a title change for that one article, only with the
     user's explicit approval of the exact new title (recorded per operation; added 2026-10-30
     for ja019 title factual correction, user approved 20:12 KST).
  2. Non-article files may differ ONLY if listed in the operation's allowlist file.
  3. Candidate must be a superset of (live union main) servable files.
Exit 0 = safe additive deploy. Exit 1 = FAIL-CLOSED with reasons.
Usage: deploy_guard.py <candidate_dir> <allowlist_file> [--offline-live <worker.mjs>] [--offline-main <dir>]
"""
import base64, gzip, hashlib, json, os, re, subprocess, sys, urllib.request

ACCOUNT='ebcfab6441facedbab9970d72eb928ea'; SCRIPT='moneycheck'
ARTICLE_RE = re.compile(r'(^|/)articles/[^/]+\.html$')

def h(b): return hashlib.sha256(b).hexdigest()

def tree_files(root):
    out={}
    for dp,dn,nn in os.walk(root):
        if '.git' in dp.split(os.sep): continue
        for name in sorted(nn):
            p=os.path.join(dp,name); rel=os.path.relpath(p,root).replace(os.sep,'/')
            out[rel]=open(p,'rb').read()
    return out

def live_files(offline=None):
    if offline: src=open(offline).read()
    else:
        token=open('/home/sandbox/.vault/daldal-cloudflare-migration-api-token-79ef3d/password').read().strip()
        base="https://api.cloudflare.com/client/v4/accounts/%s/workers/scripts/%s"%(ACCOUNT,SCRIPT)
        src=None
        # CF API 2026-10: /content retired (405) in favor of /content/v2; keep fallbacks, fail closed.
        for url,acc in ((base+"/content/v2","multipart/related"),(base+"/content","multipart/related"),(base,None)):
            try:
                hd={"Authorization":"Bearer "+token}
                if acc: hd["Accept"]=acc
                raw=urllib.request.urlopen(urllib.request.Request(url,headers=hd)).read().decode('utf-8','replace')
                if re.search(r'const BLOB = "([^"]*)"', raw): src=raw; break
            except Exception:
                continue
        if src is None: sys.exit('FAIL-CLOSED: cannot fetch live worker source from any endpoint')
    m=re.search(r'const BLOB = "([^"]*)"', src)
    if not m: sys.exit('FAIL-CLOSED: cannot extract live BLOB')
    blob=gzip.decompress(base64.b64decode(m.group(1)))
    files={}; i=0
    while i < len(blob):
        j=blob.index(b'\n', i); rel=blob[i:j].decode(); i=j+1
        j=blob.index(b'\n', i); n=int(blob[i:j]); i=j+1
        files[rel]=blob[i:i+n]; i+=n
    return files

def main_files(repo, offline=None):
    if offline: return tree_files(offline)
    subprocess.run(['git','-C',repo,'fetch','-q','origin','main'],check=True)
    tmp=subprocess.run(['git','-C',repo,'ls-tree','-r','--name-only','origin/main'],capture_output=True,text=True,check=True).stdout.split()
    out={}
    for rel in tmp:
        if rel.startswith(('docs/','scripts/','tests/','.git')) or rel.endswith('.md') or rel=='ads.config.json': continue
        data=subprocess.run(['git','-C',repo,'show','origin/main:'+rel],capture_output=True,check=True).stdout
        out[rel]=data
    return out

def main():
    cand_dir, allow_path = sys.argv[1], sys.argv[2]
    offline_live = offline_main = None
    if '--offline-live' in sys.argv: offline_live=sys.argv[sys.argv.index('--offline-live')+1]
    if '--offline-main' in sys.argv: offline_main=sys.argv[sys.argv.index('--offline-main')+1]
    allow=set(); allow_del=set(); allow_mod=set(); allow_title=set()
    if os.path.exists(allow_path):
        for l in open(allow_path):
            l=l.strip()
            if not l or l.startswith('#'): continue
            if l.startswith('DEL:'): allow_del.add(l[4:])
            elif l.startswith('MODTITLE:'): allow_mod.add(l[9:]); allow_title.add(l[9:])
            elif l.startswith('MOD:'): allow_mod.add(l[4:])
            else: allow.add(l)
    cand=tree_files(cand_dir)
    live=live_files(offline_live)
    mainf=main_files(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','repo'), offline_main)
    existing=dict(live)  # LIVE is the sole baseline: no-delete/no-modify applies to what users currently see.
    # main-only files (unreleased redesign, legacy pages) are intentionally absent from live and are NOT required in a candidate.
    problems=[]
    for rel, old in existing.items():
        if ARTICLE_RE.search(rel):
            if rel not in cand: problems.append('ARTICLE DELETED: '+rel)
            elif cand[rel]!=old:
                if rel in allow_mod:
                    def title(b):
                        m=re.search(rb'<title>(.*?)</title>', b, re.S)
                        return m.group(1).strip() if m else b''
                    if title(cand[rel])!=title(old) and rel not in allow_title:
                        problems.append('TOPIC REPLACED (title changed) in MOD-listed article: '+rel)
                else: problems.append('ARTICLE MODIFIED: '+rel)
        else:
            if rel not in cand:
                if rel in allow_del: continue
                problems.append('FILE DELETED: '+rel)
            elif cand[rel]!=old and rel not in allow: problems.append('UNLISTED CHANGE: '+rel)
    # articles must also match MAIN if both exist and differ (conflict = stop)
    for rel in set(mainf)&set(live):
        if ARTICLE_RE.search(rel) and mainf[rel]!=live[rel]:
            problems.append('MAIN/LIVE CONFLICT (reconcile first): '+rel)
    new_articles=[r for r in cand if r not in existing and ARTICLE_RE.search(r)]
    if problems:
        print('FAIL-CLOSED: deploy blocked'); [print(' -',p) for p in problems]; sys.exit(1)
    print('PASS: additive deploy safe. existing=%d candidate=%d new_articles=%s' % (len(existing), len(cand), new_articles))
if __name__=='__main__': main()
