path = "app/messages/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_import = "import { sendPush } from '@/lib/push';"
new_import = "import { sendPush } from '@/lib/push';\nimport { useNotifications } from '@/components/NotificationProvider';"

old_hook_area = "  const supabaseRef = useRef(createClient());"
new_hook_area = "  const supabaseRef = useRef(createClient());\n  const { clear } = useNotifications();"

old_mark = """      // mark incoming as read
      await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', otherId)
        .eq('recipient_id', user.id)
        .is('read_at', null);"""

new_mark = """      // mark incoming as read
      await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', otherId)
        .eq('recipient_id', user.id)
        .is('read_at', null);
      clear('dms');"""

missing = []
if old_import not in content:
    missing.append("import")
if old_hook_area not in content:
    missing.append("hook_area")
if old_mark not in content:
    missing.append("mark_read_block")

if missing:
    print("NOT FOUND, missing:", missing, "- no changes made")
else:
    content = content.replace(old_import, new_import, 1)
    content = content.replace(old_hook_area, new_hook_area, 1)
    content = content.replace(old_mark, new_mark, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
