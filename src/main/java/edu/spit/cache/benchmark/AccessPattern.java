package edu.spit.cache.benchmark;

import java.util.Random;

final class AccessPattern {
    enum Type { UNIFORM, ZIPFIAN, WORKING_SET }

    private final Random random = new Random(42);
    private final int keys;
    private final Type type;

    AccessPattern(int keys, Type type) {
        this.keys = keys;
        this.type = type;
    }

    String next() {
        int number = switch (type) {
            case UNIFORM -> random.nextInt(keys);
            case ZIPFIAN -> Math.min(keys - 1, (int) Math.floor(Math.pow(random.nextDouble(), 3) * keys));
            case WORKING_SET -> random.nextDouble() < 0.8
                    ? random.nextInt(Math.min(10, keys))
                    : random.nextInt(keys);
        };
        return "key-" + number;
    }
}
