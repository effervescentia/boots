#!/bin/bash

function get_tls() {
  openssl s_client -connect "$1:443" 2>/dev/null | openssl x509 -pubkey -noout
}

OUTPUT_DIR="$1"
RAW_RES_DIR="$OUTPUT_DIR/raw"
XML_RES_DIR="$OUTPUT_DIR/xml"

set -e

mkdir -p "$RAW_RES_DIR"
mkdir -p "$XML_RES_DIR"

curl https://letsencrypt.org/certs/staging/letsencrypt-stg-root-x1.pem > "$RAW_RES_DIR/acme_staging.crt"

cat << EOF > "$XML_RES_DIR/network_security_config.xml"
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">api.boots.effervescentia.com</domain>
    <trust-anchors>
      <certificates src="@raw/acme_staging" />
    </trust-anchors>
  </domain-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">app.boots.effervescentia.com</domain>
    <trust-anchors>
      <certificates src="@raw/acme_staging" />
    </trust-anchors>
  </domain-config>
</network-security-config>
EOF
