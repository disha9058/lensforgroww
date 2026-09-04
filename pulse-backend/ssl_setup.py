"""Pin TLS verification to certifi's CA bundle (Homebrew/Conda often override it)."""

import os
import ssl

import certifi
import httpx
from supabase import ClientOptions, create_client


def configure_ca_bundle() -> str:
    cafile = certifi.where()
    os.environ["SSL_CERT_FILE"] = cafile
    os.environ["REQUESTS_CA_BUNDLE"] = cafile
    os.environ.pop("SSL_CERT_DIR", None)
    return cafile


def create_supabase_client():
    cafile = configure_ca_bundle()
    ctx = ssl.create_default_context(cafile=cafile)
    http = httpx.Client(verify=ctx, follow_redirects=True)
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY"),
        options=ClientOptions(httpx_client=http),
    )
