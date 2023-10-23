{{ header_level }} 👥 Contributors

{% for contributor in contributors %}
  <img src="{{ contributor.avatar_url }}" size="40px" style="border-radius: 50%;"/> [@{{ contributor.login }}]({{ contributor.html_url }}) - 
{% endfor %}
