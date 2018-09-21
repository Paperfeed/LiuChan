import { LiuChan } from './LiuChan';
import { CommunicationLayer } from './CommunicationLayer';



const liuChan = new LiuChan();

CommunicationLayer.addListener('browserAction', 'onClicked', liuChan.toggleExtension.bind(liuChan));
CommunicationLayer.addListener('tabs', 'onActivated', liuChan.onTabSelect.bind(liuChan));
CommunicationLayer.addListener('windows', 'onFocusChanged', liuChan.onWindowChangeFocus.bind(liuChan));
//CommunicationLayer.addListener('storage', 'onChanged', liuChan.onConfigChange.bind(liuChan));


//chrome.browserAction.onClicked.addListener(liuChan.toggleExtension.bind(liuChan));
//chrome.tabs.onActivated.addListener(liuChan.onTabSelect.bind(liuChan));
//chrome.windows.onFocusChanged.addListener(liuChan.onWindowChangeFocus.bind(liuChan));
//chrome.storage.onChanged.addListener(liuChan.onConfigChange.bind(liuChan));

chrome.runtime.onMessage.addListener(liuChan.messageHandler);



