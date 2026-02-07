document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const statusContainer = document.getElementById('status-container');
    const resultContainer = document.getElementById('result-container');
    const uploadArea = document.getElementById('drop-zone');

    const displayFilename = document.getElementById('display-filename');
    const displayFilesize = document.getElementById('display-filesize');
    const progressFill = document.getElementById('progress-fill');
    const statusText = document.getElementById('status-text');
    const actionBtn = document.getElementById('compress-btn');

    const downloadLink = document.getElementById('download-link');
    const resetBtn = document.getElementById('reset-btn');
    const resultMessage = document.getElementById('result-message');
    const resultTitle = document.getElementById('result-title');

    const modeCompress = document.getElementById('mode-compress');
    const modeDecompress = document.getElementById('mode-decompress');
    const uploadTitle = document.getElementById('upload-title');
    const uploadSubtitle = document.getElementById('upload-subtitle');

    let selectedFile = null;
    let currentMode = 'compress'; // 'compress' or 'decompress'

    // Mode switching logic
    modeCompress.addEventListener('click', () => switchMode('compress'));
    modeDecompress.addEventListener('click', () => switchMode('decompress'));

    function switchMode(mode) {
        currentMode = mode;
        resetUI();

        if (mode === 'compress') {
            modeCompress.classList.add('active');
            modeDecompress.classList.remove('active');
            fileInput.accept = '.txt';
            uploadTitle.textContent = 'Upload File';
            uploadSubtitle.textContent = 'Select a .txt file to compress';
            actionBtn.textContent = 'Compress Now';
        } else {
            modeDecompress.classList.add('active');
            modeCompress.classList.remove('active');
            fileInput.accept = '.bin';
            uploadTitle.textContent = 'Upload Binary';
            uploadSubtitle.textContent = 'Select a .bin file to decompress';
            actionBtn.textContent = 'Decompress Now';
        }
    }

    // Handle browse button
    browseBtn.addEventListener('click', () => fileInput.click());

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            const extension = currentMode === 'compress' ? '.txt' : '.bin';

            if (!selectedFile.name.endsWith(extension)) {
                alert(`Please upload a ${extension} file for ${currentMode}.`);
                return;
            }

            displayFilename.textContent = selectedFile.name;
            displayFilesize.textContent = formatBytes(selectedFile.size);

            uploadArea.classList.add('hidden');
            statusContainer.classList.remove('hidden');
            resetStatus();
        }
    }

    function resetStatus() {
        progressFill.style.width = '0%';
        statusText.textContent = `Ready to ${currentMode}...`;
        actionBtn.disabled = false;
        actionBtn.textContent = currentMode === 'compress' ? 'Compress Now' : 'Decompress Now';
    }

    actionBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        actionBtn.disabled = true;
        actionBtn.textContent = currentMode === 'compress' ? 'Compressing...' : 'Decompressing...';
        statusText.textContent = currentMode === 'compress'
            ? 'Analyzing and building Huffman tree...'
            : 'Extracting mapping and decoding...';

        progressFill.style.width = '30%';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const apiEndpoint = currentMode === 'compress' ? '/compress' : '/decompress';
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                progressFill.style.width = '100%';
                statusText.textContent = `${currentMode === 'compress' ? 'Compression' : 'Decompression'} complete!`;

                setTimeout(() => {
                    showResult(data);
                }, 500);
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Something went wrong'));
                resetUI();
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
            resetUI();
        }
    });

    function showResult(data) {
        statusContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        downloadLink.href = data.download_url;
        downloadLink.download = data.filename;

        resultTitle.textContent = 'Success!';
        resultMessage.textContent = `Your file has been ${currentMode === 'compress' ? 'compressed' : 'decompressed'} to ${data.filename}.`;
        downloadLink.textContent = currentMode === 'compress' ? 'Download Binary (.bin)' : 'Download Text (.txt)';
    }

    resetBtn.addEventListener('click', () => {
        resetUI();
    });

    function resetUI() {
        selectedFile = null;
        fileInput.value = '';
        uploadArea.classList.remove('hidden');
        statusContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');

        // Reset toggle to current mode state if needed (already handled by switchMode)
    }
});
