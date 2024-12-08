class SRTParser {
    static parse(srtContent) {
        console.log('Starting SRT parsing...');
        const subtitles = [];
        
        // Split into blocks and clean up
        const blocks = srtContent.trim()
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n\n')
            .filter(block => block.trim().length > 0);

        console.log(`Found ${blocks.length} subtitle blocks`);

        for (const block of blocks) {
            try {
                const lines = block.split('\n').filter(line => line.trim().length > 0);
                if (lines.length < 3) continue;

                // Find the timestamp line (it contains ' --> ')
                const timeLine = lines.find(line => line.includes(' --> '));
                if (!timeLine) continue;

                const timeLineIndex = lines.indexOf(timeLine);
                const textLines = lines.slice(timeLineIndex + 1);

                // Parse timecode
                const [startTime, endTime] = timeLine.split(' --> ');
                if (!startTime || !endTime) continue;

                const subtitle = {
                    start: this.timeToMilliseconds(startTime),
                    end: this.timeToMilliseconds(endTime),
                    text: textLines.join('\n')
                };

                if (subtitle.start >= 0 && subtitle.end >= 0) {
                    subtitles.push(subtitle);
                }
            } catch (error) {
                console.error('Error parsing subtitle block:', error);
                continue;
            }
        }

        console.log(`Successfully parsed ${subtitles.length} subtitles`);
        return subtitles;
    }

    static timeToMilliseconds(timeString) {
        try {
            timeString = timeString.trim();
            const [time, milliseconds] = timeString.split(',');
            const [hours, minutes, seconds] = time.split(':').map(Number);
            
            return (hours * 3600000) +
                   (minutes * 60000) +
                   (seconds * 1000) +
                   (parseInt(milliseconds) || 0);
        } catch (error) {
            console.error('Error parsing time:', timeString, error);
            return -1;
        }
    }
}
