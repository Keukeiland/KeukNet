import { tmpdir } from 'os'

export default {
    /** Whether the server is running behind an nginx instance */
    nginx: false,
    /** The domain of the instance. */
    domain: "example.com",
    /** The interface to host on. Defaults to '::' (all interfaces) */
    host: "::",
    /** The port to listen on for HTTP traffic. Defaults to 80 */
    http_port: 80,
    /** The salt to use for encrypting the passwords. */
    salt: "PASSWORD SALT HERE!!",
    /** Location of the temporary directory. Defaults to your system's default temp dir */
    tmp_dir: tmpdir(),
    /** The location where the dicebear instance is hosted */
    dicebear_host: "https://api.dicebear.com/7.x/lorelei/svg",
    /** The location where the client files are hosted */
    client_location: "https://github.com/keukeiland/keuknet-client/releases/latest/download/",
    /** Whether connections are logged */
    logging: false,

    // Below options are only required when running standalone
    /** The port to listen on for HTTPS traffic. Defaults to 443 */
    https_port: 443,
    /** The path to your HTTPS certificate-set's private key. */
    private_key_path: `${__dirname}/../certs/privkey.pem`,
    /** The path to your HTTPS certificate-set's certificate. */
    server_cert_path: `${__dirname}/../certs/cert.pem`,
    /** The path to your HTTPS certificate-set's CA-chain. */
    ca_cert_path: `${__dirname}/../certs/ca.pem`,
}
