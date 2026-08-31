import '@fortawesome/fontawesome-svg-core/styles.css';

import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fal } from '@fortawesome/pro-light-svg-icons';
import { library, config } from '@fortawesome/fontawesome-svg-core';

config.autoAddCss = false;

library.add(fab, fas, fal);
