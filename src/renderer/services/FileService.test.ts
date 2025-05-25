import { FileService } from './FileService';

/**
 * Test functions for FileService functionality
 * These can be run in the browser console for testing
 */

/**
 * Test if Electron API is available
 */
export function testElectronAPIAvailability(): boolean {
    console.log('Testing Electron API availability...');

    const isAvailable = FileService.isElectronAPIAvailable();
    console.log('Electron API available:', isAvailable);

    if (isAvailable) {
        console.log('✅ Electron API is available');
        console.log('Available methods:', Object.keys(window.electronAPI || {}));
    } else {
        console.log('❌ Electron API is not available');
        console.log('This is expected when running in a browser without Electron');
    }

    return isAvailable;
}

/**
 * Test vault folder selection (requires user interaction)
 */
export async function testVaultSelection(): Promise<string | null> {
    console.log('Testing vault folder selection...');

    if (!FileService.isElectronAPIAvailable()) {
        console.log('❌ Cannot test vault selection - Electron API not available');
        return null;
    }

    try {
        console.log('Opening folder selection dialog...');
        const selectedPath = await FileService.selectVaultFolder();

        if (selectedPath) {
            console.log('✅ Vault folder selected:', selectedPath);
        } else {
            console.log('ℹ️ Vault folder selection was cancelled');
        }

        return selectedPath;
    } catch (error) {
        console.error('❌ Vault selection failed:', error);
        return null;
    }
}

/**
 * Test file scanning with a given path
 */
export async function testFileScanning(vaultPath: string): Promise<string[]> {
    console.log('Testing file scanning for path:', vaultPath);

    if (!FileService.isElectronAPIAvailable()) {
        console.log('❌ Cannot test file scanning - Electron API not available');
        return [];
    }

    try {
        const files = await FileService.scanVaultFiles(vaultPath);
        console.log(`✅ Found ${files.length} markdown files`);

        if (files.length > 0) {
            console.log('Sample files:', files.slice(0, 5));
            if (files.length > 5) {
                console.log(`... and ${files.length - 5} more files`);
            }
        }

        return files;
    } catch (error) {
        console.error('❌ File scanning failed:', error);
        return [];
    }
}

/**
 * Test reading file content
 */
export async function testFileReading(filePath: string): Promise<string> {
    console.log('Testing file reading for:', filePath);

    if (!FileService.isElectronAPIAvailable()) {
        console.log('❌ Cannot test file reading - Electron API not available');
        return '';
    }

    try {
        const content = await FileService.readFileContent(filePath);
        console.log(`✅ Read ${content.length} characters from file`);
        console.log('First 200 characters:', content.substring(0, 200));

        return content;
    } catch (error) {
        console.error('❌ File reading failed:', error);
        return '';
    }
}

/**
 * Test vault statistics
 */
export async function testVaultStats(vaultPath: string): Promise<void> {
    console.log('Testing vault statistics for:', vaultPath);

    if (!FileService.isElectronAPIAvailable()) {
        console.log('❌ Cannot test vault stats - Electron API not available');
        return;
    }

    try {
        const stats = await FileService.getVaultStats(vaultPath);
        console.log('✅ Vault statistics:');
        console.log('  Total files:', stats.totalFiles);
        console.log('  Estimated size:', stats.estimatedSize);
    } catch (error) {
        console.error('❌ Vault stats failed:', error);
    }
}

/**
 * Test vault path validation
 */
export async function testVaultValidation(vaultPath: string): Promise<boolean> {
    console.log('Testing vault path validation for:', vaultPath);

    if (!FileService.isElectronAPIAvailable()) {
        console.log('❌ Cannot test vault validation - Electron API not available');
        return false;
    }

    try {
        const isValid = await FileService.validateVaultPath(vaultPath);
        console.log('Vault path is valid:', isValid);

        if (isValid) {
            console.log('✅ Vault path validation passed');
        } else {
            console.log('❌ Vault path validation failed');
        }

        return isValid;
    } catch (error) {
        console.error('❌ Vault validation error:', error);
        return false;
    }
}

/**
 * Run a complete test workflow
 */
export async function runFileSystemTests(): Promise<void> {
    console.log('🧪 Running FileService tests...');

    // Test 1: API availability
    const apiAvailable = testElectronAPIAvailability();

    if (!apiAvailable) {
        console.log('⚠️ Skipping file system tests - Electron API not available');
        return;
    }

    // Test 2: Vault selection (requires user interaction)
    console.log('\n📁 Testing vault selection (requires user interaction)...');
    const selectedPath = await testVaultSelection();

    if (!selectedPath) {
        console.log('⚠️ No vault selected, using sample path for remaining tests');
        // You can replace this with a known test path
        const testPath = '/tmp';

        console.log('\n🔍 Testing with sample path:', testPath);
        await testFileScanning(testPath);
        await testVaultStats(testPath);
        await testVaultValidation(testPath);
    } else {
        // Test 3: File scanning
        console.log('\n🔍 Testing file scanning...');
        const files = await testFileScanning(selectedPath);

        // Test 4: Vault stats
        console.log('\n📊 Testing vault statistics...');
        await testVaultStats(selectedPath);

        // Test 5: Vault validation
        console.log('\n✅ Testing vault validation...');
        await testVaultValidation(selectedPath);

        // Test 6: File reading (if files found)
        if (files.length > 0) {
            console.log('\n📖 Testing file reading...');
            await testFileReading(files[0]);
        }
    }

    console.log('\n🎯 FileService tests completed!');
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
    (window as any).fileTests = {
        runFileSystemTests,
        testElectronAPIAvailability,
        testVaultSelection,
        testFileScanning,
        testFileReading,
        testVaultStats,
        testVaultValidation
    };
}
