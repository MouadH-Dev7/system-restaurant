#define MyAppName "Restaurant Server"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Restaurant Platform"
#define MyAppExeName "RestaurantServerSetup"

[Setup]
AppId={{D4A27855-4C8D-4576-B9B0-RESTAURANTSERVER}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName=C:\RestaurantServer
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputBaseFilename={#MyAppExeName}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Dirs]
Name: "{app}\config"
Name: "{app}\docs"
Name: "{app}\scripts"
Name: "{app}\services"
Name: "{app}\winsw"
Name: "{app}\winsw\templates"
Name: "{app}\nginx"
Name: "{app}\runtime"
Name: "{app}\runtime\node"
Name: "{app}\runtime\pnpm"
Name: "{app}\runtime\winsw"
Name: "{app}\runtime\nginx"
Name: "{app}\runtime\postgres"
Name: "{app}\runtime\redis"
Name: "{app}\data"
Name: "{app}\logs"
Name: "{app}\apps"
Name: "{app}\backend"
Name: "{app}\packages"

[Files]
Source: "..\config\*"; DestDir: "{app}\config"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\docs\*"; DestDir: "{app}\docs"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\services\*"; DestDir: "{app}\services"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\winsw\*"; DestDir: "{app}\winsw"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\nginx\*"; DestDir: "{app}\nginx"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\app-payload\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "postinstall.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion
Source: "validate-runtime.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion
Source: "install-services.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion
Source: "install-database-and-cache.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion

[Run]
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\installer\postinstall.ps1"" -InstallRoot ""{app}"""; StatusMsg: "Preparing Restaurant Server..."; Flags: runhidden waituntilterminated

[Icons]
Name: "{group}\Restaurant Server Docs"; Filename: "{app}\docs\README.md"
Name: "{group}\Restaurant Service Status"; Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\services\service-status.ps1"""
Name: "{commondesktop}\Restaurant Service Status"; Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\services\service-status.ps1"""; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut for service status"; GroupDescription: "Additional shortcuts:"
