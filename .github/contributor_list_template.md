{{ header_level }} 👥 Contributors

<div>
{% for contributor in contributors %}
  <a href="{{ contributor.html_url }}"><img src="{{ contributor.avatar_url }}" width="40" height="40" style="border-radius: 50%;" alt="{{ contributor.login }}"></a> - 
{% endfor %}
</div>


