import React, { StrictMode } from "react";
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";

import { PlatformApp} from "~/apps/platform";

const root = createRoot(document.getElementById("root") as Element);
root.render(
    <StrictMode>
        <BrowserRouter>
            <PlatformApp />
        </BrowserRouter>
    </StrictMode>
)
