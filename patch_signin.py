path = "components/ApprovalGate.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = '''  if (status === 'signedout') {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <h2 style={{ marginBottom: 10 }}>You need to sign in</h2>
          <p className="muted" style={{ marginBottom: 24 }}>
            This space is private to the group.
          </p>
          <Link href="/" className="btn btn-primary">
            Go to sign in ↗
          </Link>
        </div>
      </div>
    );
  }'''

new = '''  if (status === 'signedout') {
    return (
      <div className="page signin-page">
        <div className="signin-bg">
          <span className="signin-orb signin-orb-1"></span>
          <span className="signin-orb signin-orb-2"></span>
          <span className="signin-orb signin-orb-3"></span>
        </div>
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <h2 style={{ marginBottom: 10 }}>You need to sign in</h2>
          <p className="muted" style={{ marginBottom: 24 }}>
            This space is private to the group.
          </p>
          <Link href="/" className="btn btn-primary">
            Go to sign in ↗
          </Link>
        </div>
      </div>
    );
  }'''

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
