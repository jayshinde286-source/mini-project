# Phase 1 Persistent Memory Cache Module - Build Makefile

JAVAC = javac
JAVA = java
JAR = jar

SRC_DIR = src/main/java
TEST_DIR = src/test/java
BUILD_DIR = target
CLASSES_DIR = $(BUILD_DIR)/classes
TEST_CLASSES_DIR = $(BUILD_DIR)/test-classes
JAR_FILE = $(BUILD_DIR)/phase1-cache-1.0.jar

JAVA_FLAGS = --release 17 -Xlint:all -Werror

.PHONY: all verify compile test run demo clean help

all: verify

verify: compile test jar

compile:
	@echo "==> Compiling Phase 1 Main Sources..."
	@mkdir -p $(CLASSES_DIR)
	$(JAVAC) $(JAVA_FLAGS) -d $(CLASSES_DIR) $$(find $(SRC_DIR) -name "*.java")
	@echo "==> Compiling Phase 1 Test Sources..."
	@mkdir -p $(TEST_CLASSES_DIR)
	$(JAVAC) $(JAVA_FLAGS) -cp $(CLASSES_DIR) -d $(TEST_CLASSES_DIR) $$(find $(TEST_DIR) -name "*.java")

test: compile
	@echo "==> Executing Phase 1 Verification Test Suite..."
	$(JAVA) -cp $(CLASSES_DIR):$(TEST_CLASSES_DIR) edu.spit.cache.test.AllPhase1Tests

jar: compile
	@echo "==> Packaging Executable Jar for Phase 1..."
	@mkdir -p $(BUILD_DIR)
	$(JAR) --create --file $(JAR_FILE) --main-class edu.spit.cache.Main -C $(CLASSES_DIR) .
	@echo "==> Jar created successfully at $(JAR_FILE)"

run: compile
	$(JAVA) -cp $(CLASSES_DIR) edu.spit.cache.Main data/phase1_demo_wal.log

demo: compile
	@echo "==> Running Automated Phase 1 Crash Recovery Demonstration..."
	@mkdir -p data
	$(JAVA) -cp $(CLASSES_DIR):$(TEST_CLASSES_DIR) edu.spit.cache.test.Phase1IntegrationTests

clean:
	@echo "==> Cleaning build artifacts..."
	rm -rf $(BUILD_DIR) data/phase1_*.log*

help:
	@echo "Phase 1 Makefile Commands:"
	@echo "  make verify  : Compile, run tests, and create executable JAR"
	@echo "  make compile : Compile Java source files"
	@echo "  make test    : Run unit and integration tests"
	@echo "  make run     : Launch interactive Phase 1 CLI"
	@echo "  make demo    : Execute automated crash recovery demo"
	@echo "  make clean   : Remove build files"
