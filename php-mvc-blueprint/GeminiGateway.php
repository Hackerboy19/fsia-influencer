<?php
/**
 * FSIA VIP Influencer Platform
 * Secure PHP cURL Proxy to the Google Gemini Developer API
 */

class GeminiGateway {
    private static $api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private $api_key;

    public function __construct() {
        // Load API key from secure env or server configuration. Never expose this key.
        $this->api_key = getenv('GEMINI_API_KEY') ?: "YOUR_SECURE_GEMINI_API_KEY";
    }

    /**
     * Optimize user pitches into bespoke couture concepts
     * 
     * @param string $rawPitch Rough concept typed by user
     * @param string $brandName Sabyasachi / Taj etc.
     * @param string $campaignTitle Name of campaign
     * @return string Optimized response
     */
    public function optimizePitch($rawPitch, $brandName, $campaignTitle) {
        if (empty($this->api_key) || $this->api_key === "YOUR_SECURE_GEMINI_API_KEY") {
            return "The FSIA AI Gateway is unconfigured on the server. Please register your key in your .env configuration file.";
        }

        $systemInstruction = "You are an elite, world-class haute couture brand director and luxury media strategist for FSIA (Forever Star India). Your job is to optimize a creator's rough pitch/concept for a luxury brand sponsorship campaign into a majestic, highly professional premium proposal.";
        
        $promptText = "Brand: " . filter_var($brandName, FILTER_SANITIZE_SPECIAL_CHARS) . 
                     "\nCampaign: " . filter_var($campaignTitle, FILTER_SANITIZE_SPECIAL_CHARS) . 
                     "\nCreator Draft:\n\"" . filter_var($rawPitch, FILTER_SANITIZE_SPECIAL_CHARS) . "\"" .
                     "\n\nOptimize this into: REFINED EDITORIAL NARRATIVE, VISUAL STYLE MOODBOARD DIRECTION, and OUTREACH STRATEGY. Keep under 280 words.";

        // Construct Google Gemini JSON API body (compatible with v1beta endpoint)
        $payload = [
            "contents" => [
                [
                    "parts" => [
                        ["text" => $promptText]
                    ]
                ]
            ],
            "systemInstruction" => [
                "parts" => [
                    ["text" => $systemInstruction]
                ]
            ],
            "generationConfig" => [
                "temperature" => 0.7,
                "topP" => 0.95
            ]
        ];

        $url = self::$api_url . "?key=" . $this->api_key;

        // Execute secure SSL-verified server cURL transaction
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'User-Agent: aistudio-build-php'
        ]);
        
        // Strict SSL security enforcement
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12); // Prevent gateway timeout freeze

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error_msg = curl_error($ch);
            curl_close($ch);
            error_log("Gemini Gateway cURL error: " . $error_msg);
            return "Unable to bridge connection to FSIA AI Gateway. Technical code: cURL_ERROR";
        }

        curl_close($ch);

        if ($http_code !== 200) {
            error_log("Gemini Gateway Error HTTP Code " . $http_code . " with response: " . $response);
            if ($http_code === 429) {
                return "The FSIA AI Gateway is busy with pending campaigns. Please wait a moment before trying again.";
            }
            return "The Gemini AI Gateway responded with an error. Code: " . $http_code;
        }

        $result = json_decode($response, true);
        
        // Safely extract response text
        if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return $result['candidates'][0]['content']['parts'][0]['text'];
        }

        return "Couture optimization completed, but the result set was structurally empty. Please check input text quality.";
    }
}
?>
