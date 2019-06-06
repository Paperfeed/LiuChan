import { LiuChan } from './LiuChan';
import { CommunicationLayer } from './CommunicationLayer';



const liuChan = new LiuChan();

CommunicationLayer.addListener('browserAction', 'onClicked', liuChan.toggleExtension);
CommunicationLayer.addListener('tabs', 'onActivated', liuChan.onTabSelect);
CommunicationLayer.addListener('windows', 'onFocusChanged', liuChan.onWindowChangeFocus);
CommunicationLayer.addListener('storage', 'onChanged', liuChan.onConfigChange);

chrome.runtime.onMessage.addListener(liuChan.messageHandler);



