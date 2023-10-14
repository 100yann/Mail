from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("emails", views.compose, name="compose"),
    path("emails/<int:email_id>", views.email, name="email"),
    path("emails/<str:mailbox>", views.mailbox, name="mailbox"),

    # Catch all other urls and redirect to Inbox
    path("<str>", RedirectView.as_view(url='/'), name="catch_all")
]
