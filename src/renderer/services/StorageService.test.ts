import { StorageService, createDefaultAppState } from './StorageService';
import { AppState, Table } from '../../shared/types';

/**
 * Simple test functions to verify StorageService functionality
 * These can be run in the browser console for testing
 */

// Test data
const testTable: Table = {
    id: 'test-table-1',
    title: 'Test Random Table',
    entries: ['Entry 1', 'Entry 2', 'Entry 3'],
    subtables: [],
    filePath: '/test/table.md',
    codeBlockIndex: 0,
    errors: undefined
};

const testAppState: AppState = {
    vaultPath: '/test/vault',
    tables: [testTable],
    searchQuery: 'test',
    selectedTableIndex: 0,
    lastScanTime: new Date()
};

/**
 * Test saving and loading app state
 */
export async function testSaveAndLoad(): Promise<boolean> {
    try {
        console.log('Testing save and load functionality...');

        // Save test state
        await StorageService.saveAppState(testAppState);
        console.log('✅ State saved successfully');

        // Load state back
        const loadedState = await StorageService.loadAppState();
        console.log('✅ State loaded successfully:', loadedState);

        // Verify data integrity
        if (!loadedState) {
            console.error('❌ Loaded state is null');
            return false;
        }

        if (loadedState.vaultPath !== testAppState.vaultPath) {
            console.error('❌ Vault path mismatch');
            return false;
        }

        if (loadedState.tables.length !== testAppState.tables.length) {
            console.error('❌ Tables count mismatch');
            return false;
        }

        if (loadedState.searchQuery !== testAppState.searchQuery) {
            console.error('❌ Search query mismatch');
            return false;
        }

        console.log('✅ All data integrity checks passed');
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

/**
 * Test vault path operations
 */
export async function testVaultPath(): Promise<boolean> {
    try {
        console.log('Testing vault path operations...');

        const testPath = '/test/vault/path';

        // Save vault path
        await StorageService.setVaultPath(testPath);
        console.log('✅ Vault path saved');

        // Load vault path
        const loadedPath = await StorageService.getVaultPath();
        console.log('✅ Vault path loaded:', loadedPath);

        if (loadedPath !== testPath) {
            console.error('❌ Vault path mismatch');
            return false;
        }

        console.log('✅ Vault path test passed');
        return true;

    } catch (error) {
        console.error('❌ Vault path test failed:', error);
        return false;
    }
}

/**
 * Test storage clearing
 */
export async function testClearStorage(): Promise<boolean> {
    try {
        console.log('Testing storage clearing...');

        // Save some data first
        await StorageService.saveAppState(testAppState);
        await StorageService.setVaultPath('/test/path');

        // Clear storage
        await StorageService.clearAppState();
        console.log('✅ Storage cleared');

        // Verify data is gone
        const loadedState = await StorageService.loadAppState();
        const loadedPath = await StorageService.getVaultPath();

        if (loadedState !== null) {
            console.error('❌ App state should be null after clearing');
            return false;
        }

        if (loadedPath !== null) {
            console.error('❌ Vault path should be null after clearing');
            return false;
        }

        console.log('✅ Storage clearing test passed');
        return true;

    } catch (error) {
        console.error('❌ Storage clearing test failed:', error);
        return false;
    }
}

/**
 * Test default state creation
 */
export function testDefaultState(): boolean {
    try {
        console.log('Testing default state creation...');

        const defaultState = createDefaultAppState();

        if (!defaultState) {
            console.error('❌ Default state is null');
            return false;
        }

        if (defaultState.vaultPath !== undefined) {
            console.error('❌ Default vault path should be undefined');
            return false;
        }

        if (!Array.isArray(defaultState.tables) || defaultState.tables.length !== 0) {
            console.error('❌ Default tables should be empty array');
            return false;
        }

        if (defaultState.searchQuery !== '') {
            console.error('❌ Default search query should be empty string');
            return false;
        }

        if (defaultState.selectedTableIndex !== -1) {
            console.error('❌ Default selected table index should be -1');
            return false;
        }

        console.log('✅ Default state test passed');
        return true;

    } catch (error) {
        console.error('❌ Default state test failed:', error);
        return false;
    }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
    console.log('🧪 Running StorageService tests...');

    const results = {
        defaultState: testDefaultState(),
        vaultPath: await testVaultPath(),
        saveAndLoad: await testSaveAndLoad(),
        clearStorage: await testClearStorage()
    };

    console.log('\n📊 Test Results:');
    console.log('Default State:', results.defaultState ? '✅' : '❌');
    console.log('Vault Path:', results.vaultPath ? '✅' : '❌');
    console.log('Save & Load:', results.saveAndLoad ? '✅' : '❌');
    console.log('Clear Storage:', results.clearStorage ? '✅' : '❌');

    const allPassed = Object.values(results).every(result => result);
    console.log('\n🎯 Overall Result:', allPassed ? '✅ All tests passed!' : '❌ Some tests failed');
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
    (window as any).storageTests = {
        runAllTests,
        testDefaultState,
        testVaultPath,
        testSaveAndLoad,
        testClearStorage
    };
}
