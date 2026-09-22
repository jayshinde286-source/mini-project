.PHONY: all build test package run benchmark demo verify clean

JAVA := java
JAVAC := javac
MAIN_CLASS := edu.spit.cache.Main
TEST_CLASS := edu.spit.cache.test.AllTests
BENCHMARK_CLASS := edu.spit.cache.benchmark.Benchmark
JAR := target/persistent-event-driven-cache-3.0.0.jar

all: verify

build:
	@rm -rf target/classes
	@mkdir -p target/classes
	@$(JAVAC) --release 17 -Xlint:all -d target/classes $$(find src/main/java -name '*.java' | sort)

test: build
	@rm -rf target/test-classes
	@mkdir -p target/test-classes
	@$(JAVAC) --release 17 -Xlint:all -cp target/classes -d target/test-classes $$(find src/test/java -name '*.java' | sort)
	@$(JAVA) -ea -cp target/classes:target/test-classes $(TEST_CLASS)

package: build
	@mkdir -p target
	@jar --create --file $(JAR) --main-class $(MAIN_CLASS) -C target/classes .
	@echo "Created $(JAR)"

run: build
	@$(JAVA) -cp target/classes $(MAIN_CLASS)

benchmark: build
	@$(JAVA) -cp target/classes $(BENCHMARK_CLASS)

demo: build
	@$(JAVA) -Dcache.wal=target/demo/cache.wal -Dcache.snapshot=target/demo/cache.snapshot -Dcache.audit=target/demo/events.jsonl -cp target/classes $(MAIN_CLASS) < examples/demo-commands.txt

verify: test package

clean:
	@rm -rf target
