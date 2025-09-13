#!/usr/bin/env bun

/**
 * Release Workflow Validation Script
 *
 * This script validates the release workflow configuration and tests
 * the Nx release process locally to ensure it works correctly.
 */

import { $ } from 'bun';
import path from 'path';
import fs from 'fs/promises';

interface ValidationResult {
  step: string;
  success: boolean;
  message: string;
  error?: string;
}

class ReleaseWorkflowValidator {
  private results: ValidationResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  private log(
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info'
  ) {
    const icons = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
    };
    console.log(`${icons[type]} ${message}`);
  }

  private addResult(
    step: string,
    success: boolean,
    message: string,
    error?: string
  ) {
    this.results.push({ step, success, message, error });
    this.log(`${step}: ${message}`, success ? 'success' : 'error');
    if (error) {
      console.error(`   Error: ${error}`);
    }
  }

  async validateNxConfig(): Promise<void> {
    try {
      const nxConfigPath = path.join(this.projectRoot, 'nx.json');
      const nxConfig = JSON.parse(await fs.readFile(nxConfigPath, 'utf8'));

      // Check release configuration
      if (!nxConfig.release) {
        this.addResult('Nx Config', false, 'No release configuration found');
        return;
      }

      const releaseConfig = nxConfig.release;

      // Validate changelog config
      const changelogConfig = releaseConfig.changelog?.workspaceChangelog;
      if (!changelogConfig) {
        this.addResult('Nx Config', false, 'No changelog configuration found');
        return;
      }

      if (changelogConfig.createRelease !== false) {
        this.addResult(
          'Nx Config',
          false,
          'createRelease should be false to prevent conflicts with GitHub CLI'
        );
        return;
      }

      // Validate git config
      const gitConfig = releaseConfig.git;
      if (gitConfig.commit !== false || gitConfig.tag !== false) {
        this.addResult(
          'Nx Config',
          false,
          'Git commit and tag should be false - workflow handles these manually'
        );
        return;
      }

      this.addResult(
        'Nx Config',
        true,
        'Release configuration is properly set up'
      );
    } catch (error) {
      this.addResult(
        'Nx Config',
        false,
        'Failed to validate nx.json',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async validateWorkflowFile(): Promise<void> {
    try {
      const workflowPath = path.join(
        this.projectRoot,
        '.github/workflows/release.yml'
      );
      const workflowContent = await fs.readFile(workflowPath, 'utf8');

      // Check for key improvements
      const checks = [
        {
          pattern: /echo "🚀 Starting release process..."/,
          message: 'Enhanced logging present',
        },
        { pattern: /PUSH_ATTEMPTS=3/, message: 'Push retry logic implemented' },
        {
          pattern: /RELEASE_EXISTS=false/,
          message: 'Release existence check added',
        },
        {
          pattern: /Post-Release Validation/,
          message: 'Post-release validation step added',
        },
        {
          pattern: /Release Failure Notification/,
          message: 'Failure notification improved',
        },
      ];

      let allChecksPass = true;
      for (const check of checks) {
        if (!check.pattern.test(workflowContent)) {
          this.log(`Missing: ${check.message}`, 'warning');
          allChecksPass = false;
        }
      }

      this.addResult(
        'Workflow File',
        allChecksPass,
        allChecksPass
          ? 'All workflow improvements are present'
          : 'Some workflow improvements are missing'
      );
    } catch (error) {
      this.addResult(
        'Workflow File',
        false,
        'Failed to validate release.yml',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async testNxReleaseDryRun(): Promise<void> {
    try {
      this.log('Testing Nx release (dry run)...', 'info');

      // Test dry run of Nx release
      const result = await $`bunx nx release --dry-run --skip-publish`.text();

      if (result.includes('Error') || result.includes('Failed')) {
        this.addResult(
          'Nx Release Test',
          false,
          'Nx release dry run failed',
          result
        );
      } else {
        this.addResult(
          'Nx Release Test',
          true,
          'Nx release dry run successful'
        );
      }
    } catch (error) {
      this.addResult(
        'Nx Release Test',
        false,
        'Failed to run Nx release test',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async validatePackageStructure(): Promise<void> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, 'utf8')
      );

      // Check version format
      const version = packageJson.version;
      const versionRegex = /^\d+\.\d+\.\d+(-[\w.-]+)?$/;

      if (!versionRegex.test(version)) {
        this.addResult(
          'Package Structure',
          false,
          `Invalid version format: ${version}`
        );
        return;
      }

      // Check if it's a monorepo with workspaces
      if (!packageJson.workspaces || !Array.isArray(packageJson.workspaces)) {
        this.addResult(
          'Package Structure',
          false,
          'Workspaces configuration missing'
        );
        return;
      }

      this.addResult(
        'Package Structure',
        true,
        `Valid package structure with version ${version}`
      );
    } catch (error) {
      this.addResult(
        'Package Structure',
        false,
        'Failed to validate package.json',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async checkGitState(): Promise<void> {
    try {
      // Check if we're in a git repository
      await $`git rev-parse --git-dir`.quiet();

      // Check for any uncommitted changes that might interfere with release
      const status = await $`git status --porcelain`.text();
      if (status.trim()) {
        this.addResult(
          'Git State',
          false,
          'Uncommitted changes detected - these may interfere with release process'
        );
      } else {
        this.addResult('Git State', true, 'Git working directory is clean');
      }

      // Check if we can fetch tags
      await $`git fetch --tags --dry-run`.quiet();
      this.addResult('Git Tags', true, 'Can fetch git tags successfully');
    } catch (error) {
      this.addResult(
        'Git State',
        false,
        'Git repository validation failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async validateDependencies(): Promise<void> {
    try {
      // Check if required tools are available
      const tools = [
        { command: 'bunx --version', name: 'Bun' },
        { command: 'gh --version', name: 'GitHub CLI' },
        { command: 'git --version', name: 'Git' },
      ];

      for (const tool of tools) {
        try {
          await $(tool.command.split(' ')).quiet();
          this.log(`${tool.name} is available`, 'success');
        } catch {
          this.addResult(
            'Dependencies',
            false,
            `${tool.name} is not available or not working`
          );
          return;
        }
      }

      this.addResult('Dependencies', true, 'All required tools are available');
    } catch (error) {
      this.addResult(
        'Dependencies',
        false,
        'Failed to check dependencies',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async run(): Promise<void> {
    this.log('🔍 Starting Release Workflow Validation', 'info');
    console.log('='.repeat(50));

    await this.validateDependencies();
    await this.validatePackageStructure();
    await this.checkGitState();
    await this.validateNxConfig();
    await this.validateWorkflowFile();
    await this.testNxReleaseDryRun();

    console.log('\n' + '='.repeat(50));
    this.log('📊 Validation Summary', 'info');

    const successful = this.results.filter((r) => r.success).length;
    const total = this.results.length;

    console.log(`\n✅ Passed: ${successful}/${total} checks`);

    if (successful === total) {
      this.log(
        '🎉 All validation checks passed! Release workflow is ready.',
        'success'
      );
    } else {
      this.log(
        '⚠️ Some validation checks failed. Please review and fix the issues above.',
        'warning'
      );

      console.log('\n❌ Failed checks:');
      this.results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`  • ${result.step}: ${result.message}`);
          if (result.error) {
            console.log(`    Error: ${result.error}`);
          }
        });
    }

    console.log('\n📝 Next Steps:');
    console.log(
      '1. If validation passed, you can test the release workflow on a dev branch'
    );
    console.log(
      '2. Create a test commit with conventional commit format (e.g., "feat: test feature")'
    );
    console.log(
      '3. Run the release workflow to validate end-to-end functionality'
    );
    console.log(
      '4. Monitor the GitHub release creation and changelog generation'
    );
  }
}

// Run the validator
const validator = new ReleaseWorkflowValidator();
validator.run().catch(console.error);
