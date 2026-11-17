'use client';

import { Children, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Check, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';

type TasteType = 'genre' | 'artist' | 'track';
type TasteSentiment = 'preferred' | 'disliked';
type VocalPreference = 'instrumental' | 'vocals' | 'any';
interface TastePreference { id?: string; type: TasteType; sentiment: TasteSentiment; value: string; displayName: string; provider?: string; externalId?: string; metadata?: Record<string, unknown>; hardExclude?: boolean; }
interface MusicGenreOption { id: string; displayName: string; aliases: string[]; }
interface Song { id: string; title: string; artist: string; artwork: string; artistId?: string; primaryGenreName?: string; }
interface MusicTasteData { preferences: TastePreference[]; availableGenres: MusicGenreOption[]; preferredLanguages: string[]; vocalPreference: VocalPreference; qualifiesForRecommendations: boolean; }
interface MusicTasteResponse { success: boolean; data: MusicTasteData; }
interface SearchResponse { success?: boolean; data?: Song[] | { songs?: Song[]; results?: Song[]; tracks?: Song[] }; }

const LANGUAGES = ['Arabic', 'Bengali', 'Chinese', 'Dutch', 'English', 'French', 'German', 'Hindi', 'Indonesian', 'Italian', 'Japanese', 'Korean', 'Portuguese', 'Punjabi', 'Russian', 'Spanish', 'Thai', 'Turkish', 'Vietnamese'];
const fieldClass = 'w-full rounded-xl border border-white/15 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/15';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50';

export default function MusicTasteEditor({ getToken, mode = 'profile', onComplete, onSkip }: { getToken: () => Promise<string | null>; mode?: 'profile' | 'wizard'; onComplete?: () => void; onSkip?: () => void }) {
  const [preferences, setPreferences] = useState<TastePreference[]>([]);
  const [genres, setGenres] = useState<MusicGenreOption[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [vocalPreference, setVocalPreference] = useState<VocalPreference>('any');
  const [genreQuery, setGenreQuery] = useState('');
  const [genreMenuOpen, setGenreMenuOpen] = useState(false);
  const [genreSentiment, setGenreSentiment] = useState<TasteSentiment>('preferred');
  const [languageQuery, setLanguageQuery] = useState('');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [customLanguage, setCustomLanguage] = useState('');
  const [vocalMenuOpen, setVocalMenuOpen] = useState(false);
  const [artistQuery, setArtistQuery] = useState('');
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(0);
  const isWizard = mode === 'wizard';

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    setMessage('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Your session has expired. Please sign in again.');
      const response = await axios.get<MusicTasteResponse>('/api/profile/music-taste', { headers: { Authorization: `Bearer ${token}` } });
      setPreferences(response.data.data.preferences ?? []);
      setGenres(response.data.data.availableGenres ?? []);
      setLanguages(response.data.data.preferredLanguages ?? []);
      setVocalPreference(response.data.data.vocalPreference ?? 'any');
    } catch (error) {
      setLoadError(true);
      setMessage(axios.isAxiosError(error) ? error.response?.data?.message || 'Could not load your music taste. Please try again.' : error instanceof Error ? error.message : 'Could not load your music taste. Please try again.');
    } finally { setIsLoading(false); }
  }, [getToken]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const addPreference = (entry: TastePreference) => {
    const key = (item: TastePreference) => `${item.type}:${item.type === 'track' ? item.provider + ':' + (item.externalId || item.value) : item.displayName.trim().toLocaleLowerCase()}`;
    setPreferences((current) => current.some((item) => key(item) === key(entry)) ? current.map((item) => key(item) === key(entry) ? entry : item) : [...current, entry]);
    setMessage('');
  };

  const filteredGenres = useMemo(() => genres.filter((genre) => !preferences.some((item) => item.type === 'genre' && item.sentiment === genreSentiment && item.displayName.toLocaleLowerCase() === genre.displayName.toLocaleLowerCase()) && (!genreQuery.trim() || [genre.displayName, ...genre.aliases].some((name) => name.toLocaleLowerCase().includes(genreQuery.toLocaleLowerCase())))), [genres, genreQuery, genreSentiment, preferences]);
  const filteredLanguages = useMemo(() => LANGUAGES.filter((language) => !languages.some((item) => item.toLocaleLowerCase() === language.toLocaleLowerCase()) && (!languageQuery.trim() || language.toLocaleLowerCase().includes(languageQuery.toLocaleLowerCase()))), [languageQuery, languages]);

  const addLanguage = (language: string) => {
    const value = language.trim();
    if (languages.length >= 20 && !languages.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) { setMessage('You can select up to 20 preferred languages.'); return; }
    if (value && !languages.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) setLanguages((current) => [...current, value]);
    setLanguageQuery(''); setCustomLanguage(''); setLanguageMenuOpen(false); setMessage('');
  };

  const searchCatalog = async (query: string) => {
    if (!query.trim()) { setMessage('Enter a track name first.'); return; }
    setIsSearching(true); setMessage('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Your session has expired. Please sign in again.');
      const response = await axios.post<SearchResponse>('/api/song/search', { query: query.trim(), limit: 20 }, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data.data;
      const results = Array.isArray(data) ? data : data?.songs ?? data?.results ?? data?.tracks ?? [];
      setTrackResults(results);
      if (!results.length) setMessage('No tracks found. Try another search.');
    } catch (error) {
      setMessage(axios.isAxiosError(error) ? error.response?.data?.message || 'Could not find tracks. Please try again.' : error instanceof Error ? error.message : 'Could not find tracks. Please try again.');
    } finally { setIsSearching(false); }
  };

  const saveProfile = async (event?: FormEvent) => {
    event?.preventDefault();
    setIsSaving(true); setMessage('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Your session has expired. Please sign in again.');
      const response = await axios.put<MusicTasteResponse>('/api/profile/music-taste', { preferences, preferredLanguages: languages, vocalPreference }, { headers: { Authorization: `Bearer ${token}` } });
      setPreferences(response.data.data.preferences ?? preferences);
      setLanguages(response.data.data.preferredLanguages ?? languages);
      setMessage(response.data.data.qualifiesForRecommendations ? 'Music taste saved. Your recommendations are personalized.' : 'Music taste saved. Add two preferred genres or three favorite tracks for personalized recommendations.');
      if (isWizard) onComplete?.();
    } catch (error) {
      setMessage(axios.isAxiosError(error) ? error.response?.data?.message || 'Could not save your music taste. Your selections are still here; please try again.' : error instanceof Error ? error.message : 'Could not save your music taste. Your selections are still here; please try again.');
    } finally { setIsSaving(false); }
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isWizard) void saveProfile();
  };

  const selectedGenrePreferences = preferences.filter((item) => item.type === 'genre');
  const mainControls = <>
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h3 className="font-semibold text-white">Genres you enjoy or avoid</h3><p className="mt-1 text-xs text-white/55">Choose a feeling, then select one or more genres.</p></div>
        <div className="flex rounded-xl border border-white/10 bg-slate-950/50 p-1" role="group" aria-label="Genre preference">
          {(['preferred', 'disliked'] as const).map((sentiment) => <button key={sentiment} type="button" onClick={() => setGenreSentiment(sentiment)} aria-pressed={genreSentiment === sentiment} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${genreSentiment === sentiment ? sentiment === 'preferred' ? 'bg-emerald-300/20 text-emerald-100' : 'bg-rose-300/20 text-rose-100' : 'text-white/55 hover:text-white'}`}>{sentiment === 'preferred' ? 'I like' : 'I avoid'}</button>)}
        </div>
      </div>
      <div className="relative">
        <div className={`${fieldClass} flex min-h-12 flex-wrap items-center gap-2`}>
          {selectedGenrePreferences.map((genre) => <span key={`${genre.sentiment}-${genre.value}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${genre.sentiment === 'preferred' ? 'border-emerald-200/20 bg-emerald-200/10 text-emerald-50' : 'border-rose-200/20 bg-rose-200/10 text-rose-50'}`}>
            {genre.sentiment === 'preferred' ? 'Like' : 'Avoid'} {genre.displayName}
            <button type="button" aria-label={`Remove ${genre.displayName}`} onClick={() => setPreferences((current) => current.filter((item) => item !== genre))} className="rounded-full p-0.5 hover:bg-black/20"><X className="h-3.5 w-3.5" /></button>
          </span>)}
          <button type="button" onClick={() => setGenreMenuOpen((open) => !open)} aria-expanded={genreMenuOpen} aria-haspopup="listbox" className="flex min-h-7 flex-1 items-center justify-between gap-3 text-left text-sm text-white/55 outline-none">
            <span>{selectedGenrePreferences.length ? 'Add a genre' : 'Choose genres'}</span><ChevronDown className={`h-4 w-4 transition ${genreMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {genreMenuOpen && <div className="absolute z-40 mt-2 max-h-72 w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
          <input autoFocus value={genreQuery} onChange={(event) => setGenreQuery(event.target.value)} placeholder="Filter genres..." aria-label="Filter genres" className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/40" />
          <div role="listbox" aria-label="Available genres" className="max-h-48 overflow-y-auto p-2">
            {filteredGenres.length ? filteredGenres.map((genre) => <button key={genre.id} type="button" role="option" aria-selected="false" onClick={() => { addPreference({ type: 'genre', sentiment: genreSentiment, value: genre.id, displayName: genre.displayName }); setGenreQuery(''); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-white/85 hover:bg-white/10 focus:bg-white/10 focus:outline-none"><span>{genre.displayName}</span><Plus className="h-4 w-4 text-sky-200" /></button>) : <p className="px-3 py-4 text-sm text-white/50">No matching genres.</p>}
          </div>
          <button type="button" onClick={() => { setGenreMenuOpen(false); setGenreQuery(''); }} className="w-full border-t border-white/10 px-4 py-2 text-xs text-white/50 hover:text-white">Close</button>
        </div>}
      </div>
      {selectedGenrePreferences.some((genre) => genre.sentiment === 'disliked') && <div className="flex flex-wrap gap-3">{selectedGenrePreferences.filter((genre) => genre.sentiment === 'disliked').map((genre) => <label key={genre.value} className="flex items-center gap-1.5 text-xs text-white/60"><input type="checkbox" checked={genre.hardExclude === true} onChange={(event) => setPreferences((current) => current.map((item) => item === genre ? { ...item, hardExclude: event.target.checked } : item))} />Exclude {genre.displayName}</label>)}</div>}
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div><h3 className="font-semibold">Favorite artists</h3><p className="mt-1 text-xs text-white/55">Add an artist you love by name.</p></div>
        <div className="flex gap-2">
          <input value={artistQuery} onChange={(event) => setArtistQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (artistQuery.trim()) { addPreference({ type: 'artist', sentiment: 'preferred', value: artistQuery.trim(), displayName: artistQuery.trim() }); setArtistQuery(''); } } }} placeholder="Artist name" aria-label="Artist name" className={`${fieldClass} min-w-0 flex-1`} />
          <button type="button" disabled={!artistQuery.trim()} onClick={() => { if (!artistQuery.trim()) return; addPreference({ type: 'artist', sentiment: 'preferred', value: artistQuery.trim(), displayName: artistQuery.trim() }); setArtistQuery(''); }} className={`${buttonClass} min-h-12 border border-sky-300/30 bg-sky-300/15 text-sky-100`}><Plus className="h-4 w-4" />Add artist</button>
        </div>
      </section>
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div><h3 className="font-semibold">Favorite tracks</h3><p className="mt-1 text-xs text-white/55">Search the catalog, then select a track to add it.</p></div>
        <div className="flex gap-2"><input value={trackQuery} onChange={(event) => setTrackQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchCatalog(trackQuery); } }} placeholder="Track or song name" aria-label="Track or song name" className={`${fieldClass} min-w-0 flex-1`} /><button type="button" disabled={isSearching} onClick={() => void searchCatalog(trackQuery)} className={`${buttonClass} min-h-12`}><Search className="h-4 w-4" />Search track</button></div>
        {trackResults.length > 0 && <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-2">{trackResults.map((song) => <button key={song.id} type="button" onClick={() => { addPreference({ type: 'track', sentiment: 'preferred', value: song.id, displayName: song.title, provider: 'itunes', externalId: song.id, metadata: { artistName: song.artist, artistId: song.artistId, primaryGenreName: song.primaryGenreName } }); setTrackResults((current) => current.filter((item) => item.id !== song.id)); }} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/10"><img src={song.artwork} alt="" className="h-10 w-10 rounded object-cover" /><span className="min-w-0 flex-1 truncate text-sm">{song.title}<span className="block text-xs text-white/55">{song.artist}</span></span><Plus className="h-4 w-4 shrink-0" /></button>)}</div>}
      </section>
    </div>

    <section className="grid gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:grid-cols-2">
      <div><h3 className="font-semibold">Preferred languages</h3><p className="mt-1 text-xs text-white/55">Choose any languages you enjoy hearing in music.</p></div>
      <div><h3 className="font-semibold">Vocal preference</h3><p className="mt-1 text-xs text-white/55">Choose any vocal preferences, local or instrument.</p></div>
      <div>
        <div className="relative"><div className={`${fieldClass} flex min-h-12 flex-wrap items-center gap-2`}>{languages.map((language) => <span key={language} className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/20 bg-sky-200/10 px-2.5 py-1 text-xs text-sky-50">{language}<button type="button" aria-label={`Remove ${language}`} onClick={() => setLanguages((current) => current.filter((item) => item !== language))} className="rounded-full hover:text-white"><X className="h-3.5 w-3.5" /></button></span>)}<button type="button" onClick={() => setLanguageMenuOpen((open) => !open)} aria-expanded={languageMenuOpen} aria-haspopup="listbox" className="flex min-h-7 flex-1 items-center justify-between gap-3 text-left text-sm text-white/55 outline-none"><span>{languages.length ? 'Add a language' : 'Choose languages'}</span><ChevronDown className="h-4 w-4" /></button></div>
          {languageMenuOpen && <div className="absolute z-30 mt-2 max-h-64 w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl"><input autoFocus value={languageQuery} onChange={(event) => setLanguageQuery(event.target.value)} placeholder="Filter languages" aria-label="Filter languages" className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/40" /><div role="listbox" aria-label="Available languages" className="max-h-40 overflow-y-auto p-2">{filteredLanguages.map((language) => <button key={language} type="button" role="option" aria-selected="false" onClick={() => addLanguage(language)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10">{language}<Plus className="h-4 w-4 text-sky-200" /></button>)}{filteredLanguages.length === 0 && <p className="px-3 py-2 text-xs text-white/50">No matches. Add a custom language below.</p>}</div><div className="flex gap-2 border-t border-white/10 p-2"><input value={customLanguage} onChange={(event) => setCustomLanguage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addLanguage(customLanguage); } }} placeholder="Add another language" aria-label="Add another language" className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-xs outline-none" /><button type="button" onClick={() => addLanguage(customLanguage)} disabled={!customLanguage.trim()} className="rounded-lg bg-sky-200/15 px-3 py-2 text-xs text-sky-100 disabled:opacity-40">Add</button></div></div>}
        </div>
      </div>
      <div className="relative h-full">
        <button id="taste-vocals" type="button" aria-haspopup="listbox" aria-expanded={vocalMenuOpen} onClick={() => setVocalMenuOpen((open) => !open)} className={`${fieldClass} flex h-full min-h-12 items-center justify-between gap-3 text-left`}>
          <span>{vocalPreference === 'any' ? 'Any' : vocalPreference === 'vocals' ? 'Vocals' : 'Instrumental'}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition ${vocalMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {vocalMenuOpen && <div role="listbox" aria-label="Vocal preference" className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 p-2 shadow-2xl">
          {(['any', 'vocals', 'instrumental'] as const).map((preference) => <button key={preference} type="button" role="option" aria-selected={vocalPreference === preference} onClick={() => { setVocalPreference(preference); setVocalMenuOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-white/85 hover:bg-white/10 focus:bg-white/10 focus:outline-none">{preference === 'any' ? 'Any' : preference === 'vocals' ? 'Vocals' : 'Instrumental'}{vocalPreference === preference && <Check className="h-4 w-4 text-sky-200" />}</button>)}
        </div>}
      </div>
      <p className="text-xs text-white/45">Unknown track languages remain neutral.</p>
    </section>

    <section className="space-y-3"><h3 className="font-semibold">Your selections</h3>{preferences.length ? <div className="flex flex-wrap gap-2">{preferences.map((item) => <span key={`${item.type}:${item.sentiment}:${item.externalId || item.value}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs"><span className="text-white/50">{item.type === 'track' ? 'Track' : item.sentiment === 'disliked' ? 'Avoid' : 'Like'}</span>{item.displayName}<button type="button" aria-label={`Remove ${item.displayName}`} onClick={() => setPreferences((current) => current.filter((candidate) => candidate !== item))} className="text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button></span>)}</div> : <p className="text-sm text-white/50">No artists or tracks added yet.</p>}</section>
  </>;
  const controlSections = Children.toArray(mainControls.props.children);

  if (isLoading) return <div className="flex items-center gap-3 py-10 text-sm text-white/65"><Loader2 className="h-5 w-5 animate-spin" />Loading your music taste...</div>;
  if (loadError) return <div className="space-y-3 rounded-xl border border-rose-200/15 bg-rose-200/5 p-4"><p role="alert" className="text-sm text-rose-50">{message}</p><button type="button" onClick={() => void loadProfile()} className={buttonClass}>Retry</button></div>;

  return <form onSubmit={handleFormSubmit} className="space-y-5">
    {isWizard && <div className="space-y-2"><div className="flex justify-between text-xs text-white/55"><span>Step {step + 1} of 2</span><span>{step === 0 ? 'Genres & languages' : 'Artists & tracks'}</span></div><div className="flex gap-2"><span className="h-1.5 flex-1 rounded-full bg-sky-200"/><span className={`h-1.5 flex-1 rounded-full ${step === 1 ? 'bg-sky-200' : 'bg-white/15'}`}/></div></div>}
    {isWizard ? step === 0 ? <>{controlSections[0]}{controlSections[2]}</> : <>{controlSections[1]}{controlSections[3]}</> : mainControls}
    {message && <p role="status" className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-sm text-white/80">{message}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
      <p className="text-xs text-white/50">Personalized recommendations need two preferred genres or three favorite tracks.</p>
      <div className="flex gap-2">{isWizard && <button type="button" onClick={() => { if (preferences.length || languages.length || vocalPreference !== 'any') void saveProfile(); else onSkip?.(); }} disabled={isSaving} className={buttonClass}>Skip for now</button>}{isWizard && step === 1 && <button type="button" onClick={() => setStep(0)} className={buttonClass}>Back</button>}
        {isWizard && step === 0 ? <button key="continue-step" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setStep(1); }} className="inline-flex items-center gap-2 rounded-xl bg-sky-200 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-100">Continue <ChevronDown className="h-4 w-4 -rotate-90" /></button> : <button key={isWizard ? 'finish-step' : 'save-profile'} type={isWizard ? 'button' : 'submit'} onClick={isWizard ? () => void saveProfile() : undefined} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-sky-200 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-100 disabled:opacity-50">{isSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Check className="h-4 w-4" />{isWizard ? 'Save and finish' : 'Save music taste'}</>}</button>}
      </div>
    </div>
  </form>;
}

