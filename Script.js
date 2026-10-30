      const stopWords = new Set([
        'a','about','above','after','again','against','all','am','an','and','any','are','as','at','be','because','been','before','being','below','between','both','but','by','can','cannot','could','did','do','does','doing','down','during','each','few','for','from','further','had','has','have','having','he','her','here','hers','herself','him','himself','his','how','i','if','in','into','is','it','its','itself','just','me','more','most','my','myself','no','nor','not','of','off','on','once','only','or','other','our','ours','ourselves','out','over','own','same','she','should','so','some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too','under','until','up','very','was','we','were','what','when','where','which','while','who','whom','why','with','you','your','yours','yourself','yourselves','also','will','work','using','use','team','build','building','role','job','candidate','required','experience','years','need','needs','must','able','across','within','into','throughout','including','such','like','level','strong','good','high','company','products','product','business','customer','customers','users','user','operations','organization','organizations'
      ]);

      const skillKeywords = [
        'javascript', 'typescript', 'react', 'reactjs', 'node', 'nodejs', 'rest api', 'rest apis', 'sql', 'postgresql', 'mongodb', 'css', 'html', 'accessibility', 'a11y', 'performance', 'testing', 'unit testing', 'frontend architecture', 'ci/cd', 'agile', 'leadership', 'mentoring', 'design systems', 'ux', 'api integration', 'state management', 'redux', 'nextjs', 'vue', 'angular', 'python', 'aws', 'docker', 'kubernetes', 'graphql', 'web performance', 'seo', 'mobile', 'ux research'
      ];

      const pdfInput = document.getElementById('pdfInput');
      const fileName = document.getElementById('fileName');
      const dropZone = document.getElementById('dropZone');
      const rateButton = document.getElementById('rateButton');
      const statusText = document.getElementById('status');
      const scoreValue = document.getElementById('scoreValue');
      const scoreLabel = document.getElementById('scoreLabel');
      const scoreRing = document.getElementById('scoreRing');
      const skillMatchValue = document.getElementById('skillMatchValue');
      const experienceValue = document.getElementById('experienceValue');
      const signalValue = document.getElementById('signalValue');
      const strengthsList = document.getElementById('strengthsList');
      const gapsList = document.getElementById('gapsList');
      const metaText = document.getElementById('metaText');
      const jobDescription = document.getElementById('jobDescription');

      let selectedFile = null;

      function setStatus(message, isError = false) {
        statusText.textContent = message;
        statusText.style.color = isError ? '#fca5a5' : '#b9c4dc';
      }

      function normalizeText(value) {
        return value
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^a-z0-9\s\-]/g, ' ')
          .trim();
      }

      function extractKeywords(text) {
        const keywordMap = new Map();
        const phrases = [];

        skillKeywords.forEach((keyword) => {
          const phrase = keyword.toLowerCase();
          if (text.includes(phrase)) {
            keywordMap.set(phrase, { weight: phrase.split(' ').length, count: countOccurrences(text, phrase) });
          }
        });

        const tokens = text.match(/[a-z][a-z0-9+/.-]{2,}/g) || [];
        tokens.forEach((token) => {
          if (stopWords.has(token)) return;
          const current = keywordMap.get(token) || { weight: 1, count: 0 };
          const nextCount = current.count + countOccurrences(text, token);
          keywordMap.set(token, { weight: 1, count: nextCount });
        });

        const multiWordMatches = text.match(/\b[a-z]+(?:\s+[a-z]+){1,3}\b/g) || [];
        multiWordMatches.forEach((phrase) => {
          const clean = phrase.toLowerCase().trim();
          const words = clean.split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word));
          if (words.length > 1) {
            const joined = words.join(' ');
            phrases.push(joined);
          }
        });

        const uniqueKeywords = [...keywordMap.keys()]
          .concat(phrases)
          .map((item) => item.toLowerCase())
          .filter((item) => item.length > 2 && !stopWords.has(item));

        return [...new Set(uniqueKeywords)].slice(0, 18);
      }

      function countOccurrences(source, target) {
        const safeTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeTarget, 'gi');
        return (source.match(regex) || []).length;
      }

      function analyzeFit(jobText, resumeText) {
        const jobLower = normalizeText(jobText);
        const resumeLower = normalizeText(resumeText);

        const jobKeywords = extractKeywords(jobLower);
        const resumeKeywords = extractKeywords(resumeLower);
        const matchedKeywords = jobKeywords.filter((keyword) => resumeLower.includes(keyword));
        const missingKeywords = jobKeywords.filter((keyword) => !resumeLower.includes(keyword));

        const skillWeight = skillKeywords.reduce((sum, skill) => {
          const skillValue = skill.toLowerCase();
          const hasSkillInJob = jobLower.includes(skillValue);
          const hasSkillInResume = resumeLower.includes(skillValue);
          if (hasSkillInJob) {
            return sum + (hasSkillInResume ? 1.5 : 0.4);
          }
          return sum;
        }, 0);

        const maxSkillWeight = Math.max(1, skillKeywords.filter((skill) => jobLower.includes(skill.toLowerCase())).length * 1.5);
        const skillMatch = Math.min(100, Math.round((matchedKeywords.length / Math.max(1, jobKeywords.length)) * 100));
        const scoreBase = Math.min(100, Math.round((matchedKeywords.length / Math.max(1, jobKeywords.length)) * 100));

        const experienceText = /\b(\d+\+?\s*(years?|yrs?)|senior|lead|principal|manager)\b/i.test(resumeText) ? 1 : 0;
        const jobMentionsExperience = /(\d+\+?\s*(years?|yrs?)|senior|lead|expert)/i.test(jobText) ? 1 : 0;
        const experienceFit = jobMentionsExperience
          ? Math.min(100, Math.round((experienceText * 100) + (matchedKeywords.length / Math.max(1, jobKeywords.length)) * 35))
          : 75;

        const signalScore = Math.min(100, Math.round((matchedKeywords.length / Math.max(1, jobKeywords.length)) * 80 + (skillWeight / maxSkillWeight) * 22));

        const score = Math.min(100, Math.max(0, Math.round((scoreBase * 0.6) + (experienceFit * 0.25) + (signalScore * 0.15))));

        const strengths = matchedKeywords.length > 0
          ? matchedKeywords.slice(0, 6).map((item) => item.replace(/\s+/g, ' '))
          : ['The document did not contain obvious keyword overlap with the role.'];

        const gaps = missingKeywords.length > 0
          ? missingKeywords.slice(0, 6).map((item) => item.replace(/\s+/g, ' '))
          : ['No major keyword gaps detected in the supplied job description.'];

        return {
          score,
          skillMatch: Math.min(100, Math.max(0, skillMatch)),
          experienceFit: Math.min(100, Math.max(0, experienceFit)),
          signalScore: Math.min(100, Math.max(0, signalScore)),
          strengths,
          gaps,
          jobKeywords,
          matchedKeywords,
          missingKeywords,
          resumeKeywords: resumeKeywords.slice(0, 10)
        };
      }

      function updateScore(score, label, ringProgress) {
        scoreValue.textContent = `${score}%`;
        scoreLabel.textContent = label;
        scoreRing.style.background = `conic-gradient(var(--accent) ${ringProgress}deg, rgba(110, 231, 183, 0.15) ${ringProgress}deg 360deg)`;
      }

      function renderCandidate(result) {
        const score = result.score;
        let rating = 'Watchlist';
        if (score >= 85) rating = 'Excellent fit';
        else if (score >= 70) rating = 'Strong fit';
        else if (score >= 55) rating = 'Moderate fit';
        else if (score >= 35) rating = 'Possible fit';

        updateScore(score, rating, (score / 100) * 360);

        skillMatchValue.textContent = `${result.skillMatch}%`;
        experienceValue.textContent = `${result.experienceFit}%`;
        signalValue.textContent = `${result.signalScore}%`;

        strengthsList.innerHTML = result.strengths.map((item) => `<li>${item}</li>`).join('');
        gapsList.innerHTML = result.gaps.map((item) => `<li>${item}</li>`).join('');

        const roleLabel = document.getElementById('jobTitle').value || 'role';
        const fileText = selectedFile ? selectedFile.name : 'application';
        metaText.textContent = `Compared ${fileText} against the “${roleLabel}” brief.`;
      }

      async function readPdfText(file) {
        const bytes = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        let output = '';

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => (item.str || '')).join(' ');
          output += `${pageText}\n`;
        }

        return output;
      }

      function handlePickedFile(file) {
        if (!file) return;
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          setStatus('Please select a valid PDF application.', true);
          return;
        }

        selectedFile = file;
        fileName.textContent = file.name;
        setStatus('PDF ready for evaluation.');
      }

      pdfInput.addEventListener('change', (event) => {
        const [firstFile] = event.target.files;
        handlePickedFile(firstFile);
      });

      ['dragenter', 'dragover'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropZone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropZone.classList.remove('dragover');
        });
      });

      dropZone.addEventListener('drop', (event) => {
        const dropped = event.dataTransfer.files && event.dataTransfer.files[0];
        handlePickedFile(dropped);
      });

      rateButton.addEventListener('click', async () => {
        if (!selectedFile) {
          setStatus('Upload an application PDF before rating the candidate.', true);
          return;
        }

        const description = jobDescription.value.trim();
        if (!description) {
          setStatus('Add a job description to compare against the candidate.', true);
          return;
        }

        rateButton.disabled = true;
        setStatus('Extracting text from PDF and comparing against the role...');

        try {
          const resumeText = await readPdfText(selectedFile);
          const result = analyzeFit(description, resumeText);
          renderCandidate(result);
          setStatus('Analysis complete.');
        } catch (error) {
          console.error(error);
          setStatus('Could not parse the uploaded PDF. Please upload a readable PDF file.', true);
        } finally {
          rateButton.disabled = false;
        }
      });
