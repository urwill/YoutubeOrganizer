Object.defineProperty(window, "quota", {
    get() {
        return getQuota();
    },
    set(value) {
        setQuota(value);
    }
});