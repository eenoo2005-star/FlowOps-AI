import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export interface PickerOption {
  value: string
  label: string
  description?: string
}

interface SearchablePickerProps {
  value: string
  options: PickerOption[]
  placeholder: string
  searchPlaceholder?: string
  disabled?: boolean
  allowClear?: boolean
  emptyMessage?: string
  onChange: (value: string) => void
}

interface PickerPosition {
  top: number
  left: number
  width: number
  maxHeight: number
}

const pickerOpenEventName = 'flowops-searchable-picker-open'
const menuGap = 8
const menuMaxHeight = 320
const menuMinHeight = 180

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum)
}

export function SearchablePicker({
  value,
  options,
  placeholder,
  searchPlaceholder = 'Search...',
  disabled = false,
  allowClear = true,
  emptyMessage = 'No matching records.',
  onChange,
}: SearchablePickerProps) {
  const pickerId = useId()
  const menuId = `${pickerId}-menu`
  const listboxId = `${pickerId}-listbox`
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] =
    useState<PickerPosition | null>(null)

  const selected = options.find(
    (option) => option.value === value,
  )

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (normalizedQuery === '') {
      return options
    }

    return options.filter((option) =>
      `${option.label} ${option.description ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [options, query])

  const updatePosition = useCallback(() => {
    const button = buttonRef.current

    if (!button) {
      return
    }

    const rect = button.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const safeMargin = 12
    const spaceBelow =
      viewportHeight - rect.bottom - menuGap - safeMargin
    const spaceAbove = rect.top - menuGap - safeMargin
    const shouldOpenBelow =
      spaceBelow >= menuMinHeight ||
      spaceBelow >= spaceAbove
    const availableHeight = shouldOpenBelow
      ? spaceBelow
      : spaceAbove
    const maxHeight = clamp(
      availableHeight,
      menuMinHeight,
      menuMaxHeight,
    )
    const top = shouldOpenBelow
      ? rect.bottom + menuGap
      : rect.top - menuGap - maxHeight
    const left = clamp(
      rect.left,
      safeMargin,
      Math.max(safeMargin, viewportWidth - rect.width - safeMargin),
    )

    setPosition({
      top: Math.max(safeMargin, top),
      left,
      width: rect.width,
      maxHeight,
    })
  }, [])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const openMenu = useCallback(() => {
    if (disabled) {
      return
    }

    window.dispatchEvent(
      new CustomEvent<string>(pickerOpenEventName, {
        detail: pickerId,
      }),
    )

    updatePosition()
    setOpen(true)
  }, [disabled, pickerId, updatePosition])

  const toggleMenu = useCallback(() => {
    if (open) {
      closeMenu()
      return
    }

    openMenu()
  }, [closeMenu, open, openMenu])

  useEffect(() => {
    const closeOtherPickers = (event: Event) => {
      const customEvent = event as CustomEvent<string>

      if (customEvent.detail !== pickerId) {
        closeMenu()
      }
    }

    window.addEventListener(
      pickerOpenEventName,
      closeOtherPickers as EventListener,
    )

    return () => {
      window.removeEventListener(
        pickerOpenEventName,
        closeOtherPickers as EventListener,
      )
    }
  }, [closeMenu, pickerId])

  useLayoutEffect(() => {
    if (!open) {
      return undefined
    }

    updatePosition()

    const frame = window.requestAnimationFrame(() => {
      updatePosition()
      searchInputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [filtered.length, open, updatePosition])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const reposition = () => updatePosition()

    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)

    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node

      if (buttonRef.current?.contains(target)) {
        return
      }

      if (menuRef.current?.contains(target)) {
        return
      }

      closeMenu()
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeMenu, open])

  const handleTriggerKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleMenu()
    }
  }

  const selectValue = (nextValue: string) => {
    onChange(nextValue)
    closeMenu()
    buttonRef.current?.focus()
  }

  const menuStyle: CSSProperties = position
    ? {
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
      }
    : {
        visibility: 'hidden',
      }

  const optionsStyle: CSSProperties = {
    maxHeight: Math.max(
      120,
      (position?.maxHeight ?? menuMaxHeight) - 54,
    ),
  }

  const menu = open
    ? createPortal(
        <div
          id={menuId}
          ref={menuRef}
          className="flow-picker-menu flow-picker-menu-portal"
          style={menuStyle}
        >
          <div className="flow-picker-search">
            <Search size={16} />

            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder={searchPlaceholder}
              aria-controls={listboxId}
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div
            id={listboxId}
            className="flow-picker-options"
            role="listbox"
            style={optionsStyle}
          >
            {allowClear && (
              <button
                type="button"
                className="flow-picker-option"
                role="option"
                aria-selected={value === ''}
                onClick={() => selectValue('')}
              >
                <span>{placeholder}</span>
                {value === '' && <Check size={16} />}
              </button>
            )}

            {filtered.map((option) => (
              <button
                type="button"
                key={option.value}
                className="flow-picker-option"
                role="option"
                aria-selected={value === option.value}
                onClick={() => selectValue(option.value)}
              >
                <span>
                  <strong>{option.label}</strong>

                  {option.description && (
                    <small>{option.description}</small>
                  )}
                </span>

                {value === option.value && <Check size={16} />}
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="flow-picker-empty">
                {emptyMessage}
              </p>
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="flow-picker">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        className="flow-picker-trigger"
        onClick={toggleMenu}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="listbox"
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={17}
          className={open ? 'flow-picker-chevron-open' : ''}
        />
      </button>

      {menu}
    </div>
  )
}
