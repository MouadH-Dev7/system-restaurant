const os = require('os');
const fs = require('fs');
const path = require('path');

function isPrivateIpv4(value) {
  const parts = value.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const first = parts[0];
  const second = parts[1];
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function isVirtualInterfaceName(interfaceName) {
  const name = interfaceName.toLowerCase();
  return (
    name.includes('docker') ||
    name.includes('wsl') ||
    name.includes('vethernet') ||
    name.includes('hyper-v') ||
    name.includes('virtualbox') ||
    name.includes('vmware') ||
    name.includes('loopback') ||
    name.includes('virtual') ||
    name.includes('vpn') ||
    name.includes('tap') ||
    name.includes('tun') ||
    name.includes('npcap') ||
    name.includes('tailscale') ||
    name.includes('zerotier') ||
    name.includes('hamachi') ||
    name.includes('wireguard') ||
    name.includes('openvpn') ||
    name.includes('forticlient') ||
    name.includes('anyconnect')
  );
}

function scoreNetworkAddress(interfaceName, address) {
  const isVirtual = isVirtualInterfaceName(interfaceName);
  if (isVirtual) {
    return -10;
  }
  if (address.startsWith('192.168.')) {
    return 30;
  }
  if (address.startsWith('10.')) {
    return 20;
  }
  if (isPrivateIpv4(address)) {
    return 10;
  }
  return 0;
}

function getLanAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = Object.entries(interfaces)
    .flatMap(([name, addresses]) =>
      (addresses ?? []).map((address) => ({
        ...address,
        name,
        score: scoreNetworkAddress(name, address.address),
      }))
    )
    .filter((entry) => entry.family === 'IPv4' && !entry.internal && isPrivateIpv4(entry.address))
    .sort((a, b) => b.score - a.score);

  const preferred = candidates.find((entry) => entry.score > 0);
  if (preferred) {
    return preferred.address;
  }
  return null;
}

const hostIp = getLanAddress();
const hostName = os.hostname();

console.log(`Detected Host LAN IP: ${hostIp}`);
console.log(`Detected Host Hostname: ${hostName}`);

const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

function updateEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(content)) {
    return content.replace(regex, line);
  } else {
    return content.trim() + `\n${line}\n`;
  }
}

if (hostIp) {
  envContent = updateEnvVar(envContent, 'HOST_IP', hostIp);
}
envContent = updateEnvVar(envContent, 'HOST_HOSTNAME', hostName);

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('Successfully updated root .env with host network parameters.');

// Write to shared JSON file for real-time Docker synchronization without container restarts
const sharedDir = path.join(__dirname, '..', 'shared');
if (!fs.existsSync(sharedDir)) {
  fs.mkdirSync(sharedDir, { recursive: true });
}
const jsonPath = path.join(sharedDir, 'network-info.json');
fs.writeFileSync(jsonPath, JSON.stringify({ hostIp, hostName }, null, 2), 'utf8');
console.log('Successfully wrote real-time network settings to shared/network-info.json.');
