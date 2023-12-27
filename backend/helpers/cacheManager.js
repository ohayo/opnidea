//"just use redis" - IM TOO STUPID TO

const cacheManager = {
    dictionary: [],
    findById(id) {
        let entry = this.dictionary.filter(x => x.id == id);

        if (entry.length == 0) {
            return null;
        }

        return entry[0]
    },
    add(id, response_code, response_body, refresh) {
        let entry = this.findById(id);

        if (entry != null) {
            return false;
        }

        this.dictionary.push({
            id: id,
            response: {
                status_code: response_code,
                json: response_body,
                expires: refresh
            }
        });

        return true;
    },
    remove(id) {
        let entry = this.findById(id);

        if (entry == null) {
            return false;
        }

        this.dictionary.splice(this.dictionary.indexOf(entry), 1);

        return this.findById(id) == null;
    },
    update(id, response_code, response_body, refresh) {
        let entry = this.findById(id);

        if (entry == null) {
            this.add(id, response_code, response_body, refresh);

            return true;
        }

        this.remove(id);

        this.add(id, response_code, response_body, refresh);
    },
    setup() {
        setInterval(() => {
            for(var entry of this.dictionary) {
                this.remove(entry.id);
            }
        }, 1000 * 60 * 60);
    },
};

module.exports = cacheManager;