import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { networkInterfaces } from 'os';
import { TablesService } from './tables.service';

jest.mock('os', () => {
  const actual = jest.requireActual('os');

  return {
    ...actual,
    hostname: jest.fn(() => 'restaurant-server'),
    networkInterfaces: jest.fn(),
  };
});

const networkInterfacesMock = networkInterfaces as jest.MockedFunction<typeof networkInterfaces>;

function createService(networkInfoPath: string) {
  const service = new TablesService(
    {} as never,
    {} as never,
    {
      get: jest.fn(),
    } as never,
  );

  (service as unknown as { resolveSharedNetworkInfoPath: () => string }).resolveSharedNetworkInfoPath = () =>
    networkInfoPath;

  return service;
}

describe('TablesService network info', () => {
  let tempDir: string;
  let networkInfoPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'restaurant-network-'));
    networkInfoPath = join(tempDir, 'network-info.json');
    networkInterfacesMock.mockReset();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('refreshes the physical LAN IP and persists it over stale shared network info', () => {
    const service = createService(networkInfoPath);

    networkInterfacesMock.mockReturnValue({
      'Loopback Pseudo-Interface 1': [
        { address: '127.0.0.1', family: 'IPv4', internal: true, netmask: '255.0.0.0', cidr: '127.0.0.1/8', mac: '00:00:00:00:00:00' },
      ],
      'DockerNAT': [
        { address: '172.17.0.1', family: 'IPv4', internal: false, netmask: '255.255.0.0', cidr: '172.17.0.1/16', mac: '00:00:00:00:00:01' },
      ],
      'vEthernet (Default Switch)': [
        { address: '192.168.56.1', family: 'IPv4', internal: false, netmask: '255.255.255.0', cidr: '192.168.56.1/24', mac: '00:00:00:00:00:02' },
      ],
      'VPN Client': [
        { address: '10.8.0.14', family: 'IPv4', internal: false, netmask: '255.255.255.0', cidr: '10.8.0.14/24', mac: '00:00:00:00:00:03' },
      ],
      'Wi-Fi': [
        { address: '192.168.100.45', family: 'IPv4', internal: false, netmask: '255.255.255.0', cidr: '192.168.100.45/24', mac: '00:00:00:00:00:04' },
      ],
    } as never);

    const firstInfo = service.getNetworkInfo('192.168.100.7');

    expect(firstInfo.lanAddress).toBe('192.168.100.45');
    expect(JSON.parse(readFileSync(networkInfoPath, 'utf8'))).toEqual({
      hostIp: '192.168.100.45',
      hostName: 'restaurant-server',
    });

    networkInterfacesMock.mockReturnValue({
      'DockerNAT': [
        { address: '172.17.0.1', family: 'IPv4', internal: false, netmask: '255.255.0.0', cidr: '172.17.0.1/16', mac: '00:00:00:00:00:01' },
      ],
      Ethernet: [
        { address: '10.0.0.88', family: 'IPv4', internal: false, netmask: '255.255.255.0', cidr: '10.0.0.88/24', mac: '00:00:00:00:00:05' },
      ],
    } as never);

    const refreshedInfo = service.getNetworkInfo('192.168.100.45');

    expect(refreshedInfo.lanAddress).toBe('10.0.0.88');
    expect(JSON.parse(readFileSync(networkInfoPath, 'utf8'))).toMatchObject({
      hostIp: '10.0.0.88',
      hostName: 'restaurant-server',
    });
  });
});
