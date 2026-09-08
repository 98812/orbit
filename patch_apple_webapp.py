path = "app/layout.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """  title: 'Gen-Z — for revolution',
  description: 'A private space for your friend group: profiles, group chat, and Snaps with reactions.',"""

new = """  title: 'Gen-Z — for revolution',
  description: 'A private space for your friend group: profiles, group chat, and Snaps with reactions.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gen-Z',
  },"""

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
