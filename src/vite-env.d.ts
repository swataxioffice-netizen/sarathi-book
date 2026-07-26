/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
    google?: {
        accounts: {
            id: {
                initialize: (config: {
                    client_id: string;
                    callback: (response: {
                        credential: string;
                        select_by: string;
                        [key: string]: any;
                    }) => void;
                    auto_select?: boolean;
                    itp_support?: boolean;
                    use_fedcm_for_prompt?: boolean;
                }) => void;
                prompt: (callback?: (notification: {
                    isNotDisplayed: () => boolean;
                    getNotDisplayedReason: () => string;
                    isSkippedMoment: () => boolean;
                    getSkippedReason: () => string;
                    isDismissedMoment: () => boolean;
                    getDismissedReason: () => string;
                }) => void) => void;
                cancel: () => void;
                disableAutoSelect: () => void;
            };
        };
    };
}
