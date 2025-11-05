import React, { useState } from 'react';

interface SettingsProps {
    onExport: () => void;
    onImport: (jsonData: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ onExport, onImport }) => {

    const [importFile, setImportFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImportFile(e.target.files[0]);
        }
    };

    const handleImportClick = () => {
        if (!importFile) {
            alert("Por favor, selecione um arquivo de backup para importar.");
            return;
        }

        const confirmation = window.confirm(
            "ATENÇÃO!\n\nA importação de um backup substituirá TODOS os dados atuais do aplicativo. Esta ação não pode ser desfeita.\n\nRecomenda-se exportar um backup dos dados atuais antes de prosseguir.\n\nDeseja continuar com a importação?"
        );

        if (confirmation) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === 'string') {
                    onImport(result);
                }
            };
            reader.readAsText(importFile);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-text-primary">Configurações</h1>

            <div className="bg-card p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-text-primary border-b border-border-color pb-3 mb-4">Backup e Restauração de Dados</h2>
                <p className="text-text-secondary mb-6">
                    Proteja seus dados contra perdas acidentais. Exporte todos os seus registros para um arquivo de backup seguro
                    e importe-o sempre que precisar restaurar as informações.
                </p>

                <div className="space-y-8">
                    {/* Export Section */}
                    <div className="bg-background p-4 rounded-md border border-border-color">
                        <h3 className="text-lg font-medium text-text-primary mb-2">Exportar Backup</h3>
                        <p className="text-sm text-text-secondary mb-4">
                            Clique no botão abaixo para baixar um arquivo (.json) contendo todos os dados da sua loja (produtos, vendas, clientes, etc.).
                            Guarde este arquivo em um local seguro.
                        </p>
                        <button
                            onClick={onExport}
                            className="px-5 py-2 rounded-lg bg-primary hover:bg-accent text-white font-semibold transition-colors shadow-md"
                        >
                            Exportar Todos os Dados
                        </button>
                    </div>

                    {/* Import Section */}
                    <div className="bg-background p-4 rounded-md border-2 border-red-500/50">
                        <h3 className="text-lg font-medium text-text-primary mb-2">Importar Backup</h3>
                         <div className="bg-red-500/10 text-red-300 p-3 rounded-md text-sm mb-4">
                            <p className="font-bold">Atenção: Ação Irreversível!</p>
                            <p>Importar um arquivo de backup substituirá <span className="font-bold">TODOS</span> os dados existentes no aplicativo. Faça um backup dos dados atuais antes de prosseguir.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                             <input 
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="flex-grow w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-accent cursor-pointer"
                             />
                            <button
                                onClick={handleImportClick}
                                disabled={!importFile}
                                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Importar e Substituir Dados
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
