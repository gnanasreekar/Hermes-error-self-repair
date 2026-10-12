"""Agent-side entry point for the Error Tracker unified plugin.

The plugin contributes its UI and read-only API only; it registers no agent
hooks, tools, or commands.
"""


def register(ctx):
    """This plugin has no agent-side registrations."""
    return None
