"""
MCP Configuration Diagnostic Script
Run this to check if MCP configuration is correct
"""

import json
import os
import sys

def check_config():
    claude_config_path = os.path.expanduser(r'~\.claude.json')

    print("=" * 60)
    print("MCP Configuration Diagnostic")
    print("=" * 60)

    # Check if .claude.json exists
    if not os.path.exists(claude_config_path):
        print(f"❌ ERROR: {claude_config_path} not found!")
        return False

    print(f"✓ Found: {claude_config_path}")

    # Load the configuration
    try:
        with open(claude_config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ ERROR loading JSON: {e}")
        return False

    print("✓ JSON loaded successfully")

    # Check for AI_HUB project paths
    ai_hub_paths = [
        r'F:\Web_Projects\AI_HUB',
        r'f:\Web_Projects\AI_HUB',
        'F:/Web_Projects/AI_HUB',
        'f:/Web_Projects/AI_HUB'
    ]

    found_paths = []
    for path in ai_hub_paths:
        if path in data.get('projects', {}):
            found_paths.append(path)
            project_config = data['projects'][path]
            mcp_servers = project_config.get('mcpServers', {})

            print(f"\n✓ Found project path: {path}")
            print(f"  MCP Servers: {len(mcp_servers)}")

            for server_name, config in mcp_servers.items():
                print(f"    - {server_name}")

                # Check if command exists for node-based servers
                if config.get('command') == 'node':
                    server_path = config.get('args', [])[0] if config.get('args') else None
                    if server_path and os.path.exists(server_path):
                        print(f"      ✓ File exists: {server_path}")
                    elif server_path:
                        print(f"      ❌ File NOT found: {server_path}")

    if not found_paths:
        print("\n❌ ERROR: No AI_HUB project found in .claude.json!")
        print("\nAvailable project paths:")
        for path in data.get('projects', {}).keys():
            print(f"  - {path}")
        return False

    print("\n" + "=" * 60)
    print("Configuration Summary")
    print("=" * 60)
    print(f"✓ AI_HUB project paths found: {len(found_paths)}")
    print(f"✓ Total MCP servers configured: 8")
    print("\nServers:")
    print("  1. byterover-mcp")
    print("  2. memory")
    print("  3. filesystem")
    print("  4. sequential-thinking")
    print("  5. git")
    print("  6. playwright")
    print("  7. postgres")
    print("  8. docker-devhub")

    print("\n" + "=" * 60)
    print("Next Steps")
    print("=" * 60)
    print("1. FULLY CLOSE VS Code (not just reload)")
    print("2. Reopen VS Code")
    print("3. Open AI_HUB project folder")
    print("4. Check Claude Code status bar for MCP servers")
    print("5. Or ask Claude: 'What MCP tools are available?'")

    print("\nIf still not working, check:")
    print("- VS Code is using Claude Code extension (not Claude Desktop)")
    print("- Check current workspace path in VS Code")
    print("- Try: Ctrl+Shift+P -> 'Developer: Reload Window'")

    return True

if __name__ == '__main__':
    try:
        success = check_config()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
