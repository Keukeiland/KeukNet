export default {
    subnet: "fdbe:1234:abcd:1::",
    subnet_mask: "/96",
    dns_server: "fdbe:1234:abcd:1::1, 1.1.1.1",
    endpoint: "example.com",
    port: "51820",
    mtu: "1420",
    privkey: "PRIVATE KEY HERE!!", //generate with `wg genkey`
    pubkey: "PUBLIC KEY HERE!!", //generate with `echo <privkey> | wg pubkey`
}
