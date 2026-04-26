-- Sample scholarship data — run after schema.sql in the Supabase SQL editor

insert into public.scholarships (title, country, field, degree_level, deadline, link, description) values

-- United States
('Fulbright Foreign Student Program', 'United States', 'Arts & Humanities', 'masters', '2026-10-01', 'https://foreign.fulbrightonline.org/', 'Flagship US exchange program covering tuition, living expenses, and health insurance for graduate study.'),
('NSF Graduate Research Fellowship', 'United States', 'Natural Sciences', 'phd', '2026-10-15', 'https://www.nsfgrfp.org/', 'Three years of support for graduate research in STEM fields. Includes $37,000 annual stipend.'),
('Gates Millennium Scholars Program', 'United States', 'Computer Science', 'undergraduate', '2026-12-15', 'https://gmsp.org/', 'Full scholarship for outstanding minority students pursuing STEM disciplines.'),
('Knight-Hennessy Scholars', 'United States', 'Public Policy', 'masters', '2026-10-01', 'https://knight-hennessy.stanford.edu/', 'Full funding for graduate study at Stanford University. Open to all fields.'),

-- United Kingdom
('Chevening Scholarships', 'United Kingdom', 'Public Policy', 'masters', '2026-11-05', 'https://www.chevening.org/', 'UK government scholarship for future global leaders. Covers tuition, living, and travel.'),
('Rhodes Scholarship', 'United Kingdom', 'Arts & Humanities', 'masters', '2026-08-01', 'https://www.rhodeshouse.ox.ac.uk/', 'Fully funded postgraduate study at the University of Oxford for exceptional students worldwide.'),
('Commonwealth Scholarship', 'United Kingdom', 'Medicine & Health', 'phd', '2026-12-01', 'https://cscuk.fcdo.gov.uk/', 'Full scholarships for citizens of Commonwealth countries to study in the UK.'),

-- Germany
('DAAD Scholarship', 'Germany', 'Engineering', 'masters', '2026-11-15', 'https://www.daad.de/en/', 'German Academic Exchange Service funding for international students at German universities.'),
('Konrad-Adenauer-Stiftung Scholarship', 'Germany', 'Social Sciences', 'phd', '2026-07-15', 'https://www.kas.de/en/', 'Funding for outstanding doctoral students with a focus on political and social sciences.'),

-- Australia
('Australia Awards Scholarships', 'Australia', 'Agriculture', 'masters', '2026-04-30', 'https://www.australiaawards.gov.au/', 'Long-term development awards for students from developing countries to study in Australia.'),
('Endeavour Leadership Program', 'Australia', 'Environmental Science', 'phd', '2026-06-30', 'https://internationaleducation.gov.au/', 'Merit-based scholarships for high achieving students to undertake study or research in Australia.'),

-- Canada
('Vanier Canada Graduate Scholarships', 'Canada', 'Medicine & Health', 'phd', '2026-11-01', 'https://vanier.gc.ca/', '$50,000 per year for three years for doctoral students demonstrating leadership skills.'),
('Trudeau Foundation Scholarship', 'Canada', 'Social Sciences', 'phd', '2026-12-01', 'https://www.trudeaufoundation.ca/', 'Three years of support for doctoral research that engages with Canadian society.'),

-- Netherlands
('Holland Scholarship', 'Netherlands', 'Business', 'masters', '2027-01-31', 'https://www.studyinholland.nl/scholarships/', 'EUR 5,000 grant for international students from outside the EEA starting a Bachelor or Master program.'),
('Leiden Excellence Scholarship', 'Netherlands', 'Law', 'masters', '2026-09-01', 'https://www.universiteitleiden.nl/scholarships/', 'Partial or full tuition scholarships for excellent non-EEA students at Leiden University.'),

-- Japan
('MEXT Scholarship', 'Japan', 'Engineering', 'masters', '2026-05-31', 'https://www.studyinjapan.go.jp/en/stype/mext/', 'Japanese government scholarship covering tuition, monthly stipend, and travel for research students.'),
('JASSO Honors Scholarship', 'Japan', 'Natural Sciences', 'phd', '2026-08-31', 'https://www.jasso.or.jp/en/', 'Monthly scholarship for international students enrolled in Japanese universities.'),

-- Switzerland
('Swiss Government Excellence Scholarships', 'Switzerland', 'Natural Sciences', 'phd', '2026-12-15', 'https://www.sbfi.admin.ch/scholarships/', 'Research scholarships and postdoctoral fellowships for foreign scholars at Swiss universities.'),

-- Sweden
('Swedish Institute Scholarships', 'Sweden', 'Environmental Science', 'masters', '2027-02-10', 'https://si.se/en/apply/scholarships/', 'Full scholarships for global professionals to study a one or two-year master in Sweden.'),

-- Singapore
('NUS Research Scholarship', 'Singapore', 'Computer Science', 'phd', '2027-03-01', 'https://nusgs.nus.edu.sg/scholarships/', 'Full tuition, monthly stipend, and housing allowance for PhD research at the National University of Singapore.');
