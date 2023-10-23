{{ header_level }} 👥 Contributors

{% for contributor in contributors %}
- **[{{avatar_url}} @{{ contributor.login }}]({{ contributor.html_url }})**{% if contributor.contributions %} ({{ contributor.contributions }} contribution{{ "s" if contributor.contributions != 1 }}){% endif %}
{% endfor %}
