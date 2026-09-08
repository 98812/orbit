path = "components/ApprovalGate.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = '''        <div className="signin-bg">
          <span className="signin-orb signin-orb-1"></span>
          <span className="signin-orb signin-orb-2"></span>
          <span className="signin-orb signin-orb-3"></span>
        </div>'''

new = '''        <div className="signin-bg">
          <div className="night-moon"></div>
          <div className="night-stars night-stars-1"></div>
          <div className="night-stars night-stars-2"></div>
        </div>'''

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
