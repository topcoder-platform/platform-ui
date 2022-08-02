# Instructions for Creating a Self-Signed Cert

These are based off:
(https://devopscube.com/create-self-signed-certificates-openssl/)[https://devopscube.com/create-self-signed-certificates-openssl/]

## Create the Certificate Authority

```
openssl req -x509 \
            -sha256 -days 356 \
            -nodes \
            -newkey rsa:2048 \
            -subj "/CN=*.topcoder-dev.com/C=US/L=Los Angeles" \
            -keyout rootCA.key -out rootCA.crt 
```

## Create the Server Private Key

```
openssl genrsa -out server.key 2048
```

## Create Cert Signing Request Config

```
cat > csr.conf <<EOF
[ req ]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn

[ dn ]
C = US
ST = California
L = Los Angeles
O = Topcoder
OU = Topcoder Dev
CN = *.topcoder-dev.com

EOF
```

## Generate Cert Signing Request (CSR)

```
openssl req -new -key server.key -out server.csr -config csr.conf
```

## Create External File

```
cat > cert.conf <<EOF

authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.topcoder-dev.com
```

## Generate SSL Cert w/Self-Signed CA

```
openssl x509 -req \
    -in server.csr \
    -CA rootCA.crt -CAkey rootCA.key \
    -CAcreateserial -out server.crt \
    -days 365 \
    -sha256 -extfile cert.conf
```

## Add the new RootCA cert as trusted in your browser

Each OS/Browser combo has a different way to import a root cert authority, so you'll need to Google it.
