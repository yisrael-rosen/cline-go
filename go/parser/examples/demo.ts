const { GoParser } = require('../wrapper');

async function demo() {
    const parser = new GoParser();
    
    // Parse the file to get symbols
    console.log('Parsing file...');
    const parseResult = await parser.parseFile('examples/test.go');
    console.log('Symbols found:', parseResult.symbols);
    
    // Edit the ProcessData function
    console.log('\nEditing ProcessData function...');
    const editResult = await parser.editSymbol('examples/test.go', {
        symbolName: 'ProcessData',
        editType: 'replace',
        newContent: `
// ProcessData handles data processing with validation
func ProcessData(data []byte) error {
    if len(data) == 0 {
        return fmt.Errorf("empty data")
    }
    return nil
}`
    });
    
    console.log('Edit result:', editResult);
}

demo().catch(console.error);
