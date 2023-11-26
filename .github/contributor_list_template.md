{{ header_level }} 👥 Contributors

{% for contributor in contributors %}<img src="{{contributor.avatar_url}}" height="40" width="40" alt="{{contributor.login}}" title="{{contributor.login}}" class="avatar circle"/>&nbsp;{% endfor %}
