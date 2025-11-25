export default {
    async fetch(request, env) {
        // Fallback to assets
        return env.ASSETS.fetch(request);
    },
};
