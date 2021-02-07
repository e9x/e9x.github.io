add-type -assemblyname PresentationFramework

$object = new-object -comobject shell.application;
#$folder = $object.browseforfolder(0, 'Locate your Krunker installation folder', 0)

#if($folder -eq $null){
#	exit;
#}

#$path = join-path -path $folder.self.path -childpath 'resources';
$path = 'E:\Program Files (x86)\Steam\steamapps\common\Krunker\resources';
$asar = join-path -path $path -childpath 'app.asar';

if(![System.IO.File]::Exists($asar)){
	[System.Windows.MessageBox]::Show('Krunker is not installed here')
	
	exit;
}

$backup = join-path -path $path -childpath 'app.asar.bak';

if([System.IO.File]::Exists($backup)){
	[System.Windows.MessageBox]::Show('Krunker already patched, exiting..')
	
	exit;
}

copy-item -path $asar -destination $backup;

$client = new-object System.Net.WebClient
$client.downloadfile('https://e9x.github.io/kru/client/app.asar', $asar)

[System.Windows.MessageBox]::Show('Krunker successfully patched');