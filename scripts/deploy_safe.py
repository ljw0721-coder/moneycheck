#!/usr/bin/env python3
"""TrendCheck deploy entrypoint. The guard runs HERE, inside the entrypoint.
Failing guard -> nonzero exit BEFORE any upload. No shell-&& dependency.
Env:
  DEPLOY_SAFE_MOCK_UPLOAD_FILE - when set, no network upload happens; instead
  this file is written with the would-be upload summary (sentinel testing).
  CF_TOKEN_FILE, CF_ACCOUNT_ID, CF_WORKER_SCRIPT - real upload credentials.
Usage: deploy_safe.py <candidate_tree_dir> <allowlist_path> <staged_live_base.mjs> [--offline-live <blob.mjs>] [--offline-main <dir>]
"""
import base64, gzip, json, os, re, subprocess, sys, urllib.request

def main():
    a=sys.argv[1:]
    tree, allow, base = a[0], a[1], a[2]
    extra=[]
    if '--offline-live' in a: extra += ['--offline-live', a[a.index('--offline-live')+1]]
    if '--offline-main' in a: extra += ['--offline-main', a[a.index('--offline-main')+1]]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Support both the repository layout and the existing split deploy toolbox.
    guard = os.path.join(script_dir, 'deploy_guard.py')
    if not os.path.exists(guard):
        guard = os.path.join(script_dir, '..', 'guard', 'deploy_guard.py')
    # Image rights must agree with the candidate archive, before any mutation/upload.
    verifier = os.path.join(script_dir, 'verify-image-metadata.mjs')
    ri = subprocess.run(['node', verifier, tree, os.path.join(tree, 'data', 'image-rights.json')], capture_output=True, text=True)
    sys.stdout.write(ri.stdout); sys.stderr.write(ri.stderr)
    if ri.returncode != 0:
        print('DEPLOY ABORTED: image metadata validation failed. No upload attempted.', file=sys.stderr)
        return 2
    # 0) reader-discovery self-heal: idempotent, additive-only; abort on failure
    upd = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'apply-reader-discovery.mjs')
    r0 = subprocess.run(['node', upd, tree], capture_output=True, text=True)
    sys.stdout.write(r0.stdout); sys.stderr.write(r0.stderr)
    if r0.returncode != 0:
        print('DEPLOY ABORTED: reader-discovery updater failed. No upload attempted.', file=sys.stderr)
        return 2
    # 1) GUARD FIRST - abort before any upload work
    r = subprocess.run([sys.executable, guard, tree, allow] + extra, capture_output=True, text=True)
    sys.stdout.write(r.stdout); sys.stderr.write(r.stderr)
    if r.returncode != 0:
        print('DEPLOY ABORTED: guard failed (exit %d). No upload attempted.' % r.returncode, file=sys.stderr)
        return r.returncode if r.returncode else 2
    # 1.5) pre-upload runtime smoke on the staged base worker (real BLOB ->
    # Uint8Array path, js etag/304 contract, css cache preserved). Aborts on fail.
    smoke = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'worker_smoke.mjs')
    rs = subprocess.run(['node', smoke, base], capture_output=True, text=True)
    sys.stdout.write(rs.stdout); sys.stderr.write(rs.stderr)
    if rs.returncode != 0:
        print('DEPLOY ABORTED: worker smoke failed (exit %d). No upload attempted.' % rs.returncode, file=sys.stderr)
        return rs.returncode if rs.returncode else 2
    # 2) build blob from candidate tree
    parts=[]; n=0
    for dp,dn,nn in os.walk(tree):
        for name in sorted(nn):
            p=os.path.join(dp,name); rel=os.path.relpath(p,tree).replace(os.sep,'/')
            data=open(p,'rb').read(); parts.append(rel.encode()+b'\n'+str(len(data)).encode()+b'\n'+data); n+=1
    blob=base64.b64encode(gzip.compress(b''.join(parts))).decode()
    live=open(base).read()
    new,cnt=re.subn(r'const BLOB = "[^"]*"','const BLOB = "%s"'%blob,live,count=1)
    assert cnt==1, 'BLOB marker not found in staged base'
    mock=os.environ.get('DEPLOY_SAFE_MOCK_UPLOAD_FILE')
    if mock:
        with open(mock,'w') as f: json.dump({'files':n,'bytes':len(new)}, f)
        print('MOCK UPLOAD recorded -> %s (%d files)' % (mock,n))
        return 0
    token=open(os.environ.get('CF_TOKEN_FILE','/home/sandbox/.vault/daldal-cloudflare-migration-api-token-79ef3d/password')).read().strip()
    acct=os.environ.get('CF_ACCOUNT_ID','ebcfab6441facedbab9970d72eb928ea')
    script=os.environ.get('CF_WORKER_SCRIPT','moneycheck')
    # Content-only upload preserves the current D1 and secret bindings/settings.
    meta=json.dumps({"main_module":"worker.mjs"})
    b='----mcdeploy'
    body=('--%s\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n%s\r\n--%s\r\nContent-Disposition: form-data; name="worker.mjs"; filename="worker.mjs"\r\nContent-Type: application/javascript+module\r\n\r\n%s\r\n--%s--\r\n'%(b,meta,b,new,b))
    req=urllib.request.Request("https://api.cloudflare.com/client/v4/accounts/%s/workers/scripts/%s/content"%(acct,script),data=body.encode(),method="PUT",headers={"Authorization":"Bearer "+token,"Content-Type":"multipart/form-data; boundary="+b})
    ok=json.load(urllib.request.urlopen(req)).get('success')
    print('REAL UPLOAD success:', ok)
    return 0 if ok else 3

if __name__=='__main__':
    sys.exit(main())
